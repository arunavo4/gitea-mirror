import type { GitOrg } from "@/types/organizations";
import type { GitRepo } from "@/types/Repository";
import { Octokit } from "@octokit/rest";
import type { Config } from "@/types/config";
import type { Repository } from "./db/schema";
import superagent from "superagent";
import { getGithubRepoCloneUrl } from "./github";

export const mirrorGithubRepoToGitea = async ({
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
    const { cloneUrl } = await getGithubRepoCloneUrl({ octokit, owner, repo });

    let cloneAddress = cloneUrl;

    // If the repo is private, inject the GitHub token into the clone URL
    if (repository.isPrivate) {
      if (!config.githubConfig.token) {
        throw new Error(
          "GitHub token is required to mirror private repositories."
        );
      }

      cloneAddress = cloneUrl.replace(
        "https://",
        `https://${config.githubConfig.token}@`
      );
    }

    const apiUrl = `${config.giteaConfig.url}/api/v1/repos/migrate`;

    const response = await superagent
      .post(apiUrl)
      .set("Authorization", `token ${config.giteaConfig.token}`)
      .send({
        clone_addr: cloneAddress,
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

export async function mirrorGithubOrgRepoIssuesToGiteaOrg({
  config,
  octokit,
  repo,
  orgName,
}: {
  config: Partial<Config>;
  octokit: Octokit;
  repo: any;
  orgName: string;
}) {
  if (!config.giteaConfig?.url || !config.giteaConfig?.token) {
    throw new Error("Gitea config is required.");
  }

  console.log(`Cloning issues for repo "${repo.name}"...`);

  const { data: issues } = await octokit.rest.issues.listForRepo({
    owner: repo.owner.login,
    repo: repo.name,
    state: "all",
    per_page: 100,
  });

  if (issues.length === 0) {
    console.log(`No issues to clone for repo "${repo.name}".`);
    return;
  }

  // Step 1: Get existing Gitea labels
  const giteaLabelsRes = await fetch(
    `${config.giteaConfig.url}/api/v1/repos/${orgName}/${repo.name}/labels`,
    {
      headers: {
        Authorization: `token ${config.giteaConfig.token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const giteaLabels = giteaLabelsRes.ok ? await giteaLabelsRes.json() : [];

  // Step 2: Helper to find or create a label and get its ID
  async function getLabelId(labelName: string): Promise<number> {
    const existing = giteaLabels.find((l: any) => l.name === labelName);
    if (existing) return existing.id;

    // Create label if missing
    const createRes = await fetch(
      `${config.giteaConfig?.url}/api/v1/repos/${orgName}/${repo.name}/labels`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${config.giteaConfig?.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: labelName,
          color: "ffffff", // white default
        }),
      }
    );

    if (!createRes.ok) {
      console.error(
        `Failed to create label "${labelName}": ${await createRes.text()}`
      );
      return 0;
    }

    const newLabel = await createRes.json();
    giteaLabels.push(newLabel); // update local cache
    console.log(`Created label "${labelName}"`);
    return newLabel.id;
  }

  // Step 3: Create issues with correct label IDs
  for (const issue of issues) {
    if (issue.pull_request) {
      continue; // Skip PRs
    }

    const labelIds = [];
    for (const label of issue.labels || []) {
      if (typeof label === "string") {
        const labelId = await getLabelId(label); // label is string directly
        if (labelId) {
          labelIds.push(labelId);
        }
      } else if (typeof label === "object" && label.name) {
        const labelId = await getLabelId(label.name); // label.name exists
        if (labelId) {
          labelIds.push(labelId);
        }
      }
    }

    const createIssueRes = await fetch(
      `${config.giteaConfig.url}/api/v1/repos/${orgName}/${repo.name}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${config.giteaConfig.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: issue.title,
          body: issue.body || "",
          labels: labelIds, // <-- send label IDs!
          closed: issue.state === "closed",
        }),
      }
    );

    if (!createIssueRes.ok) {
      console.error(
        `❌ Failed to create issue "${
          issue.title
        }": ${await createIssueRes.text()}`
      );
    } else {
      console.log(`Created issue "${issue.title}"`);
    }
  }

  console.log(`Finished cloning issues for repo "${repo.name}"`);
}

export async function migrateRepoToGiteaOrg({
  octokit,
  config,
  repo,
  giteaOrgId,
  orgName,
}: {
  octokit: Octokit;
  config: Partial<Config>;
  repo: any;
  giteaOrgId: number;
  orgName: string;
}) {
  if (!config.giteaConfig?.url || !config.giteaConfig?.token) {
    throw new Error("Gitea config is required.");
  }

  const { cloneUrl } = await getGithubRepoCloneUrl({
    octokit,
    owner: repo.owner.login,
    repo: repo.name,
  });

  console.log(`Clone URL for repo "${repo.name}": ${cloneUrl}`);

  let cloneAddress = cloneUrl;
  if (repo.private) {
    if (!config.githubConfig?.token) {
      throw new Error(
        "GitHub token is required to mirror private repositories."
      );
    }
    cloneAddress = cloneUrl.replace(
      "https://",
      `https://${config.githubConfig.token}@`
    );
  }

  const migrateRes = await fetch(
    `${config.giteaConfig.url}/api/v1/repos/migrate`,
    {
      method: "POST",
      headers: {
        Authorization: `token ${config.giteaConfig.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clone_addr: cloneAddress,
        uid: giteaOrgId,
        repo_name: repo.name,
        mirror: true,
        private: repo.private,
      }),
    }
  );

  if (!migrateRes.ok) {
    const errorText = await migrateRes.text();
    console.error(`Failed to migrate repo "${repo.name}": ${errorText}`);
    return;
  }

  console.log(`Successfully mirrored repo: ${repo.name}`);

  // After migrating the repo, clone issues
  await mirrorGithubOrgRepoIssuesToGiteaOrg({
    config,
    octokit,
    repo,
    orgName,
  });
}

export async function mirrorGithubOrgToGitea({
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
      orgName,
      config,
    });

    const { data: repos } = await octokit.rest.repos.listForOrg({
      org: orgName,
      type: "all",
      per_page: 100,
    });

    console.log(
      `📦 Found ${repos.length} repositories in GitHub org "${orgName}"`
    );

    for (const repo of repos) {
      await migrateRepoToGiteaOrg({
        octokit,
        config,
        repo,
        giteaOrgId,
        orgName,
      });
    }

    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}
