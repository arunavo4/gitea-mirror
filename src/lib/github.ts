import { Octokit } from "@octokit/rest";
import type { Repository } from "./db/schema";
import type { Config } from "@/types/config";
import type { GitRepo } from "@/types/Repository";

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
 */
export async function getUserRepositories(
  octokit: Octokit,
  config: Partial<Config>
): Promise<GitRepo[]> {
  const { data: repos } = await octokit.repos.listForAuthenticatedUser({
    per_page: 100,
    sort: "updated",
  });

  return repos
    .filter((repo) => {
      // Skip forks if configured
      if (config.github?.skipForks && repo.fork) {
        return false;
      }

      // Skip private repos if not configured to include them
      if (repo.private && !config.github?.privateRepositories) {
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
      if (config.github?.skipForks && repo.fork) {
        return false;
      }

      // Skip private repos if not configured to include them
      if (repo.private && !config.github?.privateRepositories) {
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
export async function getUserOrganizations(octokit: Octokit): Promise<any[]> {
  const { data: orgs } = await octokit.orgs.listForAuthenticatedUser({
    per_page: 100,
  });

  return orgs.map((org) => ({
    name: org.login,
    type: "member",
    avatarUrl: org.avatar_url,
    description: org.description,
  }));
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
