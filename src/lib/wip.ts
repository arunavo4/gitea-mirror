// this is a temporary file to store the utility functions becasue right now the app has too many lib files
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
export async function cloneRepository({
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
export async function getUserRepositories({
  octokit,
  config,
}: {
  octokit: Octokit;
  config: Partial<Config>;
}): Promise<GitRepo[]> {
  try {
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: "updated",
    });

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
      .map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        url: repo.html_url,
        isPrivate: repo.private,
        isFork: repo.fork,
        owner: repo.owner.login,
        organization:
          repo.owner.type === "Organization" ? repo.owner.login : undefined,
        hasIssues: repo.has_issues !== undefined ? repo.has_issues : false,
        isStarred: false, // Will be set separately
      }));
  } catch (error) {
    throw new Error(
      `Error fetching repositories: ${
        error instanceof Error ? error.message : error
      }`
    );
  }
}

export async function getUserOrganizations({
  octokit,
}: {
  octokit: Octokit;
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

/**
 * Mirror a repository to Gitea
 */
export const mirrorRepoToGitea = async ({
  octokit,
  repository,
  config,
}: {
  octokit: Octokit;
  repository: Repository;
  config: Partial<Config>;
}): Promise<any> => {
  try {
    if (!config.githubConfig || !config.giteaConfig) {
      throw new Error("github config and gitea config are required.");
    }

    // Get repository details
    const [owner, repo] = repository.fullName.split("/");
    const { cloneUrl } = await cloneRepository({ octokit, owner, repo });

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

/**
 * Get or create a Gitea organization
 */
export async function getOrCreateGiteaOrg({
  orgName,
  config,
}: {
  orgName: string;
  config: Partial<Config>;
}): Promise<number> {
  if (!config.giteaConfig?.url || !config.giteaConfig?.token) {
    throw new Error("Gitea config is required.");
  }
  // Try to fetch the org first
  const orgRes = await fetch(
    `${config.giteaConfig.url}/api/v1/orgs/${orgName}`,
    {
      headers: {
        Authorization: `token ${config.giteaConfig.token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (orgRes.ok) {
    const org = await orgRes.json();
    console.log(`Found existing Gitea org: ${orgName} (ID: ${org.id})`);
    return org.id;
  }

  // If not found, create the organization
  console.log(`Creating new Gitea org: ${orgName}`);
  const createRes = await fetch(`${config.giteaConfig.url}/api/v1/orgs`, {
    method: "POST",
    headers: {
      Authorization: `token ${config.giteaConfig.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: orgName,
      full_name: `${orgName} Org`,
      description: `Mirrored organization from GitHub ${orgName}`,
      visibility: "public",
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create Gitea org: ${await createRes.text()}`);
  }

  const newOrg = await createRes.json();
  console.log(`Created Gitea org: ${newOrg.username} (ID: ${newOrg.id})`);
  return newOrg.id;
}

/**
 * Mirror a git repo to Gitea org
 */
export async function migrateRepoToGitea({
  octokit,
  config,
  repo,
  giteaOrgId,
}: {
  octokit: Octokit;
  config: Partial<Config>;
  repo: any;
  giteaOrgId: number;
}) {
  if (!config.giteaConfig?.url || !config.giteaConfig?.token) {
    throw new Error("Gitea config is required.");
  }

  const { cloneUrl } = await cloneRepository({
    octokit,
    owner: repo.owner.login,
    repo: repo.name,
  });

  console.log("clone url for repo- ", repo.name, " is -", cloneUrl);

  const migrateRes = await fetch(
    `${config.giteaConfig.url}/api/v1/repos/migrate`,
    {
      method: "POST",
      headers: {
        Authorization: `token ${config.giteaConfig.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clone_addr: cloneUrl,
        uid: giteaOrgId,
        repo_name: repo.name,
        mirror: true,
        private: repo.isPrivate,
      }),
    }
  );

  if (!migrateRes.ok) {
    console.error(
      `Failed to migrate repo ${repo.name}: ${await migrateRes.text()}`
    );
  } else {
    console.log(`Mirrored repo: ${repo.name}`);
  }
}

/**
 * Migrate all repositories from GitHub org to Gitea
 */
export async function mirrorOrgReposToGitea({
  orgName,
  octokit,
  config,
}: {
  orgName: string;
  octokit: Octokit;
  config: Partial<Config>;
}) {
  try {
    if (!config.githubConfig?.token || !config.giteaConfig?.url) {
      throw new Error("GitHub token and Gitea URL are required.");
    }

    const giteaOrgId = await getOrCreateGiteaOrg({
      orgName: orgName,
      config,
    });

    // Step 2: Fetch all repos from GitHub org
    const { data: repos } = await octokit.rest.repos.listForOrg({
      org: orgName,
      type: "all",
      per_page: 100,
    });

    console.log(`📦 Found ${repos.length} repos in GitHub org ${orgName}`);

    // Step 3: Migrate each repo into Gitea
    for (const repo of repos) {
      await migrateRepoToGitea({
        octokit,
        config,
        repo,
        giteaOrgId,
      });
    }

    console.log("🚀 Migration completed.");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
}

//temp code
export async function deleteAllReposInOrg({
  config,
  org,
}: {
  config: Partial<Config>;
  org: string;
}) {
  if (!config.giteaConfig?.url || !config.giteaConfig?.token) {
    throw new Error("Gitea config is required.");
  }

  // Step 1: Get all repositories in the organization
  const repoRes = await fetch(
    `${config.giteaConfig.url}/api/v1/orgs/${org}/repos`,
    {
      headers: {
        Authorization: `token ${config.giteaConfig.token}`,
      },
    }
  );

  if (!repoRes.ok) {
    console.error(
      `Failed to fetch repos for org ${org}: ${await repoRes.text()}`
    );
    return;
  }

  const repos = await repoRes.json();

  // Step 2: Delete each repository
  for (const repo of repos) {
    const deleteRes = await fetch(
      `${config.giteaConfig.url}/api/v1/repos/${org}/${repo.name}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `token ${config.giteaConfig.token}`,
        },
      }
    );

    if (!deleteRes.ok) {
      console.error(
        `Failed to delete repo ${repo.name}: ${await deleteRes.text()}`
      );
    } else {
      console.log(`Successfully deleted repo ${repo.name}`);
    }
  }
}

export async function deleteOrg({
  config,
  org,
}: {
  config: Partial<Config>;
  org: string;
}) {
  if (!config.giteaConfig?.url || !config.giteaConfig?.token) {
    throw new Error("Gitea config is required.");
  }

  const deleteOrgRes = await fetch(
    `${config.giteaConfig.url}/api/v1/orgs/${org}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `token ${config.giteaConfig.token}`,
      },
    }
  );

  if (!deleteOrgRes.ok) {
    console.error(`Failed to delete org ${org}: ${await deleteOrgRes.text()}`);
  } else {
    console.log(`Successfully deleted org ${org}`);
  }
}

export async function deleteAllOrgs({
  config,
  orgs,
}: {
  config: Partial<Config>;
  orgs: string[];
}) {
  for (const org of orgs) {
    console.log(`Starting deletion for org: ${org}`);

    // First, delete all repositories in the organization
    await deleteAllReposInOrg({ config, org });

    // Then, delete the organization itself
    await deleteOrg({ config, org });

    console.log(`Finished deletion for org: ${org}`);
  }
}
