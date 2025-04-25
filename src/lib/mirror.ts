import { Octokit } from "@octokit/rest";
import type { Config, Repository, MirrorJob } from "./db/schema";
import * as github from "./github";
import * as gitea from "./gitea";
import { db, repositories, mirrorJobs } from "./db";
import { eq } from "drizzle-orm";
import superagent from "superagent";

/**
 * Mirror a single repository from GitHub to Gitea
 */
export async function mirrorSingleRepository(
  config: Config,
  repository: Repository,
  jobId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Create GitHub client
    const githubClient = github.createGitHubClient(
      config.githubConfig.token || ""
    );

    // Get repository details
    const [owner, repo] = repository.fullName.split("/");
    const { cloneUrl } = await github.cloneRepository(
      githubClient,
      owner,
      repo
    );

    // Determine target organization
    let targetOrg = undefined;
    if (repository.isStarred && config.giteaConfig.starredReposOrg) {
      targetOrg = config.giteaConfig.starredReposOrg;
    } else if (
      repository.organization &&
      config.githubConfig.preserveOrgStructure
    ) {
      targetOrg = repository.organization;
    } else if (config.giteaConfig.organization) {
      targetOrg = config.giteaConfig.organization;
    }

    // Create organization if needed
    if (targetOrg) {
      await gitea.createGiteaOrganization(
        config.giteaConfig.url,
        config.giteaConfig.token,
        targetOrg,
        `GitHub organization: ${targetOrg}`,
        config.giteaConfig.visibility
      );
    }

    // Mirror the repository
    await gitea.mirrorRepository(
      config.giteaConfig.url,
      config.giteaConfig.token,
      cloneUrl,
      repository.name,
      repository.isPrivate,
      targetOrg
    );

    // Mirror issues if configured
    if (config.githubConfig.mirrorIssues && repository.hasIssues) {
      // Skip issues for starred repos if configured
      if (!(repository.isStarred && config.githubConfig.skipStarredIssues)) {
        const issues = await github.getRepositoryIssues(
          githubClient,
          owner,
          repo
        );

        // Create issues in Gitea
        for (const issue of issues) {
          await gitea.createGiteaIssue(
            config.giteaConfig.url,
            config.giteaConfig.token,
            targetOrg || owner,
            repository.name,
            issue.title,
            `*Mirrored from GitHub*\n\nOriginal issue by @${issue.user}\n\n${
              issue.body || ""
            }`,
            issue.labels
          );
        }
      }
    }

    // Update repository status
    await db
      .update(repositories)
      .set({
        status: "mirrored",
        lastMirrored: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(repositories.id, repository.id || ""));

    // Add log entry
    const job = await db
      .select()
      .from(mirrorJobs)
      .where(eq(mirrorJobs.id, jobId))
      .limit(1);
    if (job.length) {
      const log = JSON.parse(job[0].log);
      log.push({
        timestamp: new Date(),
        message: `Successfully mirrored repository: ${repository.fullName}`,
        level: "success",
      });

      await db
        .update(mirrorJobs)
        .set({
          log: JSON.stringify(log),
          updatedAt: new Date(),
        })
        .where(eq(mirrorJobs.id, jobId));
    }

    return {
      success: true,
      message: `Successfully mirrored repository: ${repository.fullName}`,
    };
  } catch (error) {
    // Update repository status
    await db
      .update(repositories)
      .set({
        status: "failed",
        errorMessage: error.message,
        updatedAt: new Date(),
      })
      .where(eq(repositories.id, repository.id || ""));

    // Add log entry
    const job = await db
      .select()
      .from(mirrorJobs)
      .where(eq(mirrorJobs.id, jobId))
      .limit(1);
    if (job.length) {
      const log = JSON.parse(job[0].log);
      log.push({
        timestamp: new Date(),
        message: `Failed to mirror repository: ${repository.fullName}`,
        level: "error",
        details: error.message,
      });

      await db
        .update(mirrorJobs)
        .set({
          log: JSON.stringify(log),
          updatedAt: new Date(),
        })
        .where(eq(mirrorJobs.id, jobId));
    }

    return {
      success: false,
      message: `Failed to mirror repository: ${error.message}`,
    };
  }
}

/**
 * Mirror all repositories based on configuration
 */
export async function mirrorAllRepositories(
  config: Config,
  jobId: string
): Promise<{
  success: boolean;
  message: string;
  mirrored: number;
  failed: number;
}> {
  try {
    // Get repositories to mirror
    const reposToMirror = await db
      .select()
      .from(repositories)
      .where(eq(repositories.configId, config.id || ""));

    let mirrored = 0;
    let failed = 0;

    // Add log entry
    const job = await db
      .select()
      .from(mirrorJobs)
      .where(eq(mirrorJobs.id, jobId))
      .limit(1);
    if (job.length) {
      const log = JSON.parse(job[0].log);
      log.push({
        timestamp: new Date(),
        message: `Starting mirroring process for ${reposToMirror.length} repositories`,
        level: "info",
      });

      await db
        .update(mirrorJobs)
        .set({
          log: JSON.stringify(log),
          status: "running",
          startedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(mirrorJobs.id, jobId));
    }

    // Mirror each repository
    for (const repo of reposToMirror) {
      try {
        const result = await mirrorSingleRepository(config, repo, jobId);
        if (result.success) {
          mirrored++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;

        // Add log entry
        if (job.length) {
          const log = JSON.parse(job[0].log);
          log.push({
            timestamp: new Date(),
            message: `Failed to mirror repository: ${repo.fullName}`,
            level: "error",
            details: error.message,
          });

          await db
            .update(mirrorJobs)
            .set({
              log: JSON.stringify(log),
              updatedAt: new Date(),
            })
            .where(eq(mirrorJobs.id, jobId));
        }
      }
    }

    // Update job status
    if (job.length) {
      const log = JSON.parse(job[0].log);
      log.push({
        timestamp: new Date(),
        message: `Mirroring process completed. ${mirrored} repositories mirrored, ${failed} failed.`,
        level: "info",
      });

      await db
        .update(mirrorJobs)
        .set({
          log: JSON.stringify(log),
          status: "completed",
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(mirrorJobs.id, jobId));
    }

    return {
      success: true,
      message: `Mirroring process completed. ${mirrored} repositories mirrored, ${failed} failed.`,
      mirrored,
      failed,
    };
  } catch (error) {
    // Update job status
    const job = await db
      .select()
      .from(mirrorJobs)
      .where(eq(mirrorJobs.id, jobId))
      .limit(1);
    if (job.length) {
      const log = JSON.parse(job[0].log);
      log.push({
        timestamp: new Date(),
        message: `Mirroring process failed: ${error.message}`,
        level: "error",
        details: error.stack,
      });

      await db
        .update(mirrorJobs)
        .set({
          log: JSON.stringify(log),
          status: "failed",
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(mirrorJobs.id, jobId));
    }

    return {
      success: false,
      message: `Mirroring process failed: ${error.message}`,
      mirrored: 0,
      failed: 0,
    };
  }
}

/**
 * Sync repositories from GitHub based on configuration
 */
export async function syncRepositories(
  config: Config
): Promise<{ added: number; updated: number; message: string }> {
  try {
    // Create GitHub client
    const githubClient = github.createGitHubClient(config.github.token || "");

    let allRepos: Repository[] = [];

    // Get user repositories
    if (!config.githubConfig.onlyMirrorOrgs) {
      const userRepos = await github.getUserRepositories(githubClient, config);
      allRepos = [...allRepos, ...userRepos];
    }

    // Get starred repositories
    if (config.githubConfig.mirrorStarred) {
      const starredRepos = await github.getStarredRepositories(
        githubClient,
        config
      );
      allRepos = [...allRepos, ...starredRepos];
    }

    // Get organization repositories
    if (config.githubConfig.mirrorOrganizations) {
      const orgs = await github.getUserOrganizations(githubClient);

      for (const org of orgs) {
        // Skip if org is in exclude list
        if (
          config.githubConfig.excludeOrgs &&
          config.githubConfig.excludeOrgs.includes(org.name)
        ) {
          continue;
        }

        // Only include if in include list (when not using wildcard)
        if (
          config.githubConfig.includeOrgs &&
          config.githubConfig.includeOrgs.length > 0 &&
          !config.githubConfig.includeOrgs.includes("*") &&
          !config.githubConfig.includeOrgs.includes(org.name)
        ) {
          continue;
        }

        const orgRepos = await github.getOrganizationRepositories(
          githubClient,
          org.name,
          config
        );
        allRepos = [...allRepos, ...orgRepos];
      }
    }

    // Filter repositories based on include/exclude patterns
    const filteredRepos = allRepos.filter((repo) => {
      // Check exclude patterns
      if (config.exclude && config.exclude.length > 0) {
        for (const pattern of config.exclude) {
          if (matchPattern(repo.fullName, pattern)) {
            return false;
          }
        }
      }

      // Check include patterns
      if (
        config.include &&
        config.include.length > 0 &&
        !config.include.includes("*")
      ) {
        for (const pattern of config.include) {
          if (matchPattern(repo.fullName, pattern)) {
            return true;
          }
        }
        return false;
      }

      return true;
    });

    // Update database
    let added = 0;
    let updated = 0;

    for (const repo of filteredRepos) {
      // Check if repository already exists
      const existingRepo = await db
        .select()
        .from(repositories)
        .where(eq(repositories.fullName, repo.fullName))
        .where(eq(repositories.configId, config.id || ""))
        .limit(1);

      if (existingRepo.length === 0) {
        // Add new repository
        await db.insert(repositories).values({
          ...repo,
          id: crypto.randomUUID(),
          configId: config.id || "",
        });
        added++;
      } else {
        // Update existing repository
        await db
          .update(repositories)
          .set({
            name: repo.name,
            url: repo.url,
            isPrivate: repo.isPrivate,
            isFork: repo.isFork,
            owner: repo.owner,
            organization: repo.organization,
            hasIssues: repo.hasIssues,
            isStarred: repo.isStarred,
            updatedAt: new Date(),
          })
          .where(eq(repositories.id, existingRepo[0].id || ""));
        updated++;
      }
    }

    return {
      added,
      updated,
      message: `Synced repositories: ${added} added, ${updated} updated`,
    };
  } catch (error) {
    throw new Error(`Failed to sync repositories: ${error.message}`);
  }
}

/**
 * Match a string against a pattern (supports * wildcard)
 */
function matchPattern(str: string, pattern: string): boolean {
  // Convert pattern to regex
  const regexPattern = pattern.replace(/\./g, "\\.").replace(/\*/g, ".*");

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(str);
}

//latest apis

export const mirrorRepoToGitea = async ({
  repository,
  config,
}: {
  repository: Repository;
  config: Partial<Config>;
}): Promise<any> => {
  try {
    if (!config.githubConfig || !config.giteaConfig) {
      throw new Error("github config and gitea config are required.");
    }

    const githubClient = github.createGitHubClient(
      config.githubConfig.token || ""
    );

    // Get repository details
    const [owner, repo] = repository.fullName.split("/");
    const { cloneUrl } = await github.cloneRepository(
      githubClient,
      owner,
      repo
    );

    const apiUrl = `${config.giteaConfig.url}/api/v1/repos/migrate`;

    const response = await superagent
      .post(apiUrl)
      .set("Authorization", `token ${config.giteaConfig.token}`)
      .send({
        clone_addr: cloneUrl,
        repo_name: repository.name,
        mirror: true,
        private: repository.isPrivate,
        repo_owner: repository.organization || owner,
        service: "git",
      });

    return response.body;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to mirror repository: ${error.message}`);
    }
    throw new Error("Failed to mirror repository: An unknown error occurred.");
  }
};
