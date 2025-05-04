import type { GitOrg, MembershipRole } from "@/types/organizations";
import type { GitRepo, RepoStatus } from "@/types/Repository";
import { Octokit } from "@octokit/rest";
import type { Config } from "@/types/config";

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
      { per_page: 100 }
    );

    const includePrivate = config.githubConfig?.privateRepositories ?? false;
    const skipForks = config.githubConfig?.skipForks ?? false;

    const filteredRepos = repos.filter((repo) => {
      const isPrivateAllowed = includePrivate || !repo.private;
      const isForkAllowed = !skipForks || !repo.fork;
      return isPrivateAllowed && isForkAllowed;
    });

    return filteredRepos.map((repo) => ({
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      cloneUrl: repo.clone_url,

      owner: repo.owner.login,
      organization:
        repo.owner.type === "Organization" ? repo.owner.login : undefined,

      isPrivate: repo.private,
      isForked: repo.fork,
      forkedFrom: (repo as typeof repo & { parent?: { full_name: string } })
        .parent?.full_name,

      hasIssues: repo.has_issues,
      isStarred: false,
      isArchived: repo.archived,

      size: repo.size,
      hasLFS: false,
      hasSubmodules: false,

      defaultBranch: repo.default_branch,
      visibility: (repo.visibility ?? "public") as GitRepo["visibility"],

      status: "imported",
      lastMirrored: undefined,
      errorMessage: undefined,

      createdAt: repo.created_at ? new Date(repo.created_at) : new Date(),
      updatedAt: repo.updated_at ? new Date(repo.updated_at) : new Date(),
    }));
  } catch (error) {
    throw new Error(
      `Error fetching repositories: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function getGithubStarredRepositories({
  octokit,
  config,
}: {
  octokit: Octokit;
  config: Partial<Config>;
}) {
  try {
    const starredRepos = await octokit.paginate(
      octokit.activity.listReposStarredByAuthenticatedUser,
      {
        per_page: 100,
      }
    );

    return starredRepos.map((repo) => ({
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      cloneUrl: repo.clone_url,

      owner: repo.owner.login,
      organization:
        repo.owner.type === "Organization" ? repo.owner.login : undefined,

      isPrivate: repo.private,
      isForked: repo.fork,
      forkedFrom: undefined,

      hasIssues: repo.has_issues,
      isStarred: true,
      isArchived: repo.archived,

      size: repo.size,
      hasLFS: false, // Placeholder
      hasSubmodules: false, // Placeholder

      defaultBranch: repo.default_branch,
      visibility: (repo.visibility ?? "public") as GitRepo["visibility"],

      status: "imported",
      lastMirrored: undefined,
      errorMessage: undefined,

      createdAt: repo.created_at ? new Date(repo.created_at) : new Date(),
      updatedAt: repo.updated_at ? new Date(repo.updated_at) : new Date(),
    }));
  } catch (error) {
    throw new Error(
      `Error fetching starred repositories: ${
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

        return {
          name: org.login,
          avatarUrl: org.avatar_url,
          membershipRole: membership.role as MembershipRole,
          isIncluded: false,
          status: "imported" as RepoStatus,
          repositoryCount: totalRepos,
          createdAt: new Date(),
          updatedAt: new Date(),
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
 * Get repositories for a specific organization
 */
export async function getGithubOrganizationRepositories({
  octokit,
  organizationName,
}: {
  octokit: Octokit;
  organizationName: string;
}): Promise<GitRepo[]> {
  try {
    const repos = await octokit.paginate(octokit.repos.listForOrg, {
      org: organizationName,
      per_page: 100,
    });

    return repos.map((repo) => ({
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      cloneUrl: repo.clone_url ?? "",

      owner: repo.owner.login,
      organization: repo.owner.login,

      isPrivate: repo.private,
      isForked: repo.fork,
      forkedFrom: (repo as typeof repo & { parent?: { full_name: string } })
        .parent?.full_name,

      hasIssues: repo.has_issues ?? false,
      isStarred: false, // Organization starred repos are separate API
      isArchived: repo.archived ?? false,

      size: repo.size ?? 0,
      hasLFS: false,
      hasSubmodules: false,

      defaultBranch: repo.default_branch ?? "main",
      visibility: (repo.visibility ?? "public") as GitRepo["visibility"],

      status: "imported",
      lastMirrored: undefined,
      errorMessage: undefined,

      createdAt: repo.created_at ? new Date(repo.created_at) : new Date(),
      updatedAt: repo.updated_at ? new Date(repo.updated_at) : new Date(),
    }));
  } catch (error) {
    throw new Error(
      `Error fetching organization repositories: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
