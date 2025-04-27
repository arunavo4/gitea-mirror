import type { GitOrg } from "@/types/organizations";
import type { GitRepo } from "@/types/Repository";
import { Octokit } from "@octokit/rest";
import type { Config } from "@/types/config";
import type { Repository } from "./db/schema";
import superagent from "superagent";

/**
 * Creates an authenticated Octokit instance
 */
export function createGitHubClient(token: string): Octokit {
  return new Octokit({
    auth: token,
  });
}

/**
 * Clone a repository from GitHub
 */
export async function getGithubRepoCloneUrl({
  octokit,
  owner,
  repo,
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
}): Promise<{ url: string; cloneUrl: string }> {
  const { data } = await octokit.repos.get({
    owner,
    repo,
  });

  return {
    url: data.html_url,
    cloneUrl: data.clone_url,
  };
}

/**
 * Get user repositories from GitHub
 * todo: need to handle pagination and apply more filters based on user config
 */
export async function getGithubRepositories({
  octokit,
  config,
}: {
  octokit: Octokit;
  config: Partial<Config>;
}): Promise<GitRepo[]> {
  try {
    const repos = await octokit.paginate(
      octokit.repos.listForAuthenticatedUser,
      {
        per_page: 100,
      }
    );

    return repos
      .filter((repo) => {
        // Skip forks if configured
        if (config.githubConfig?.skipForks && repo.fork) {
          return false;
        }

        // Skip private repos if not configured to include them
        if (repo.private && !config.githubConfig?.privateRepositories) {
          return false;
        }

        return true;
      })
      .map((repo) => {
        const repoWithParent = repo as typeof repo & {
          parent?: { full_name: string };
        };

        return {
          name: repo.name,
          fullName: repo.full_name,
          url: repo.html_url,
          cloneUrl: repo.clone_url,

          owner: repo.owner.login,
          organization:
            repo.owner.type === "Organization" ? repo.owner.login : undefined,

          isPrivate: repo.private,
          isForked: repo.fork,
          forkedFrom: repoWithParent.fork
            ? repoWithParent.parent?.full_name
            : undefined,

          hasIssues: repo.has_issues,
          isStarred: false, // we need separate API to fetch stars
          isArchived: repo.archived,

          size: repo.size,
          hasLFS: false, // placeholder for now
          hasSubmodules: false, // placeholder for now

          defaultBranch: repo.default_branch,
          visibility: (repo.visibility ?? "public") as Repository["visibility"],

          status: "imported",
          lastMirrored: undefined,
          errorMessage: undefined,

          createdAt: repo.created_at ? new Date(repo.created_at) : new Date(),
          updatedAt: repo.updated_at ? new Date(repo.updated_at) : new Date(),
        };
      });
  } catch (error) {
    throw new Error(
      `Error fetching repositories: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Get user github organizations
 */
export async function getGithubOrganizations({
  octokit,
  config,
}: {
  octokit: Octokit;
  config: Partial<Config>;
}): Promise<GitOrg[]> {
  try {
    const { data: orgs } = await octokit.orgs.listForAuthenticatedUser({
      per_page: 100,
    });

    const organizations = await Promise.all(
      orgs.map(async (org) => {
        const [{ data: orgDetails }, { data: membership }] = await Promise.all([
          octokit.orgs.get({ org: org.login }),
          octokit.orgs.getMembershipForAuthenticatedUser({ org: org.login }),
        ]);

        const totalRepos =
          orgDetails.public_repos + (orgDetails.total_private_repos ?? 0);

        console.log("membership", membership.organization);

        return {
          name: org.login,
          avatarUrl: org.avatar_url,
          description: org.description || null,
          totalRepos,
          userViewType: membership.role,
        };
      })
    );

    return organizations;
  } catch (error) {
    throw new Error(
      `Error fetching organizations: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
