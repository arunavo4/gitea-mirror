import { Octokit } from "@octokit/rest";
import type { Repository } from "./db/schema";
import type { Config } from "@/types/config";
import type { GitRepo } from "@/types/Repository";
import type { GitOrg } from "@/types/organizations";

/**
 * Creates an authenticated Octokit instance
 */
export function createGitHubClient(token: string): Octokit {
  return new Octokit({
    auth: token,
  });
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

/**
 * Get starred repositories from GitHub
 */
export async function getStarredRepositories(
  octokit: Octokit,
  config: Partial<Config>
): Promise<Repository[]> {
  const { data: repos } =
    await octokit.activity.listReposStarredByAuthenticatedUser({
      per_page: 100,
      sort: "updated",
    });

  return repos.map((repo) => ({
    name: repo.name,
    fullName: repo.full_name,
    url: repo.html_url,
    isPrivate: repo.private,
    isFork: repo.fork,
    owner: repo.owner.login,
    organization:
      repo.owner.type === "Organization" ? repo.owner.login : undefined,
    hasIssues: repo.has_issues ?? false,
    isStarred: true,
    status: "pending",
    configId: config.id || "",
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

/**
 * Get organization repositories from GitHub
 */
export async function getOrganizationRepositories(
  octokit: Octokit,
  orgName: string,
  config: Partial<Config>
): Promise<Repository[]> {
  const { data: repos } = await octokit.repos.listForOrg({
    org: orgName,
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
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      isPrivate: repo.private,
      isFork: repo.fork,
      owner: repo.owner.login,
      organization:
        repo.owner.type === "Organization" ? repo.owner.login : undefined,
      hasIssues: repo.has_issues ?? false,
      isStarred: false,
      status: "pending",
      configId: config.id || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
}

/**
 * Get user organizations from GitHub
 */
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
 * Get repository issues from GitHub
 */
export async function getRepositoryIssues(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<any[]> {
  const { data: issues } = await octokit.issues.listForRepo({
    owner,
    repo,
    per_page: 100,
    state: "all",
  });

  return issues.map((issue) => ({
    number: issue.number,
    title: issue.title,
    body: issue.body,
    state: issue.state,
    user: issue.user?.login || "unknown",
    labels: issue.labels
      .map((label) => (typeof label === "string" ? label : label.name))
      .filter(Boolean),
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    closedAt: issue.closed_at,
  }));
}

/**
 * Get repository contents from GitHub
 */
export async function getRepositoryContents(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string = ""
): Promise<any> {
  const { data } = await octokit.repos.getContent({
    owner,
    repo,
    path,
  });

  return data;
}

/**
 * Clone a repository from GitHub
 */
export async function cloneRepository(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<{ url: string; cloneUrl: string }> {
  const { data } = await octokit.repos.get({
    owner,
    repo,
  });

  return {
    url: data.html_url,
    cloneUrl: data.clone_url,
  };
}

//latest apis that are in use
export async function getAllOrgRepoContents({
  octokit,
  org,
}: {
  octokit: Octokit;
  org: string;
}) {
  // Step 1: List all repos
  const repos = await octokit.paginate(octokit.repos.listForOrg, {
    org,
    type: "all", // includes public and private if token allows
    per_page: 100,
  });

  const allContents: Record<string, any[]> = {};

  // Step 2: For each repo, get all contents
  for (const repo of repos) {
    console.log(`Fetching contents for repo: ${repo.name}`);
    allContents[repo.name] = await getAllContentsOfRepo({
      octokit,
      owner: org,
      repo: repo.name,
    });
  }

  return allContents;
}

export async function getAllContentsOfRepo({
  octokit,
  owner,
  repo,
  path = "",
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
  path?: string;
}): Promise<any[]> {
  const contents: any[] = [];

  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });

    if (Array.isArray(data)) {
      for (const item of data) {
        contents.push(item);
        if (item.type === "dir") {
          const subContents = await getAllContentsOfRepo({
            octokit,
            owner,
            repo,
            path: item.path,
          });
          contents.push(...subContents);
        }
      }
    } else {
      contents.push(data);
    }
  } catch (error) {
    console.error(
      `Error fetching contents for ${owner}/${repo}/${path}`,
      error
    );
  }

  return contents;
}
