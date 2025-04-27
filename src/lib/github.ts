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
