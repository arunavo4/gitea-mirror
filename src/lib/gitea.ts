import superagent from "superagent";
import type { Config, Repository } from "./db/schema";

/**
 * Test connection to Gitea
 */
export async function testGiteaConnection(
  url: string,
  token: string
): Promise<any> {
  try {
    const response = await superagent
      .get(`${url}/api/v1/user`)
      .set("Authorization", `token ${token}`);

    return {
      success: true,
      username: response.body.username,
      avatarUrl: response.body.avatar_url,
    };
  } catch (error) {
    console.error("Error connecting to Gitea:", error);
    throw new Error(`Failed to connect to Gitea: ${error.message}`);
  }
}

/**
 * Create a repository in Gitea
 */
export async function createGiteaRepository(
  url: string,
  token: string,
  name: string,
  description: string = "",
  isPrivate: boolean = false,
  organization?: string
): Promise<any> {
  try {
    const apiUrl = organization
      ? `${url}/api/v1/orgs/${organization}/repos`
      : `${url}/api/v1/user/repos`;

    const response = await superagent
      .post(apiUrl)
      .set("Authorization", `token ${token}`)
      .send({
        name,
        description,
        private: isPrivate,
        auto_init: false,
      });

    return response.body;
  } catch (error) {
    throw new Error(`Failed to create Gitea repository: ${error.message}`);
  }
}

/**
 * Check if a repository exists in Gitea
 */
export async function checkGiteaRepository(
  url: string,
  token: string,
  owner: string,
  name: string
): Promise<boolean> {
  try {
    await superagent
      .get(`${url}/api/v1/repos/${owner}/${name}`)
      .set("Authorization", `token ${token}`);

    return true;
  } catch (error) {
    if (error.status === 404) {
      return false;
    }
    throw new Error(`Failed to check Gitea repository: ${error.message}`);
  }
}

/**
 * Create an organization in Gitea
 */
export async function createGiteaOrganization(
  url: string,
  token: string,
  name: string,
  description: string = "",
  visibility: string = "public"
): Promise<any> {
  try {
    // Check if organization already exists
    try {
      const existingOrg = await superagent
        .get(`${url}/api/v1/orgs/${name}`)
        .set("Authorization", `token ${token}`);

      return existingOrg.body;
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
      // Organization doesn't exist, continue with creation
    }

    const response = await superagent
      .post(`${url}/api/v1/orgs`)
      .set("Authorization", `token ${token}`)
      .send({
        username: name,
        description,
        visibility,
      });

    return response.body;
  } catch (error) {
    throw new Error(`Failed to create Gitea organization: ${error.message}`);
  }
}

/**
 * Create an issue in Gitea
 */
export async function createGiteaIssue(
  url: string,
  token: string,
  owner: string,
  repo: string,
  title: string,
  body: string,
  labels: string[] = []
): Promise<any> {
  try {
    const response = await superagent
      .post(`${url}/api/v1/repos/${owner}/${repo}/issues`)
      .set("Authorization", `token ${token}`)
      .send({
        title,
        body,
        labels,
      });

    return response.body;
  } catch (error) {
    throw new Error(`Failed to create Gitea issue: ${error.message}`);
  }
}

/**
 * Mirror a repository from GitHub to Gitea
 */
export async function mirrorRepository(
  giteaUrl: string,
  giteaToken: string,
  githubCloneUrl: string,
  repoName: string,
  isPrivate: boolean = false,
  organization?: string
): Promise<any> {
  try {
    const apiUrl = organization
      ? `${giteaUrl}/api/v1/repos/migrate`
      : `${giteaUrl}/api/v1/repos/migrate`;

    const response = await superagent
      .post(apiUrl)
      .set("Authorization", `token ${giteaToken}`)
      .send({
        clone_addr: githubCloneUrl,
        repo_name: repoName,
        mirror: true,
        private: isPrivate,
        repo_owner: organization || undefined,
        service: "git",
      });

    return response.body;
  } catch (error) {
    throw new Error(`Failed to mirror repository: ${error.message}`);
  }
}
