import type { GitRepo } from "@/types/Repository";
import { Octokit } from "@octokit/rest";
import type { Config } from "@/types/config";
import type { Repository } from "./db/schema";
import superagent from "superagent";
import { getGithubOrganizationRepositories } from "./github";
import { createMirrorJob } from "./helpers";

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

    let cloneAddress = repository.cloneUrl;

    // If the repository is private, inject the GitHub token into the clone URL
    if (repository.isPrivate) {
      if (!config.githubConfig.token) {
        throw new Error(
          "GitHub token is required to mirror private repositories."
        );
      }

      cloneAddress = repository.cloneUrl.replace(
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
        repo_owner: "ani1609", // replace with your Gitea username or maybe some other dynamic value
        description: "",
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
  if (
    !config.giteaConfig?.url ||
    !config.giteaConfig?.token ||
    !config.userId
  ) {
    throw new Error("Gitea config is required.");
  }

  try {
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
      return org.id;
    }

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

    await createMirrorJob({
      userId: config.userId,
      organizationName: orgName,
      status: "imported",
      message: `Organization ${orgName} fetched successfully`,
      details: `Organization ${orgName} was fetched from GitHub`,
    });

    const newOrg = await createRes.json();
    return newOrg.id;
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error occurred in getOrCreateGiteaOrg.";

    await createMirrorJob({
      userId: "ani1609",
      organizationName: orgName,
      message: `Failed to create Gitea organization: ${orgName}`,
      status: "failed",
      details: `Error: ${errorMessage}`,
    });

    throw new Error(`Error in getOrCreateGiteaOrg: ${errorMessage}`);
  }
}

export async function mirrorGitHubRepoToGiteaOrg({
  octokit,
  config,
  repository,
  giteaOrgId,
}: {
  octokit: Octokit;
  config: Partial<Config>;
  repository: GitRepo;
  giteaOrgId: number;
}) {
  if (!config.giteaConfig?.url || !config.giteaConfig?.token) {
    throw new Error("Gitea config is required.");
  }

  let cloneAddress = repository.cloneUrl;

  if (repository.isPrivate) {
    if (!config.githubConfig?.token) {
      throw new Error(
        "GitHub token is required to mirror private repositories."
      );
    }

    cloneAddress = repository.cloneUrl.replace(
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
        repo_name: repository.name,
        mirror: true,
        private: repository.isPrivate,
      }),
    }
  );

  if (!migrateRes.ok) {
    const errorText = await migrateRes.text();
    console.error(
      `Failed to migrate repository "${repository.name}": ${errorText}`
    );
    return;
  }

  // After migrating the repository, clone issues
  // await mirrorGithubOrgRepoIssuesToGiteaOrg({
  //   config,
  //   octokit,
  //   repository,
  //   orgName,
  // });
}

export async function mirrorGutHubOrgRepoToGiteaOrg({
  config,
  octokit,
  repository,
  orgName,
}: {
  config: Partial<Config>;
  octokit: Octokit;
  repository: GitRepo;
  orgName: string;
}) {
  if (!config.giteaConfig?.url || !config.giteaConfig?.token) {
    throw new Error("Gitea config is required.");
  }

  const giteaOrgId = await getOrCreateGiteaOrg({
    orgName,
    config,
  });

  await mirrorGitHubRepoToGiteaOrg({
    octokit,
    config,
    repository,
    giteaOrgId,
  });
}

export async function mirrorGitHubOrgToGitea({
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

    const repos = await getGithubOrganizationRepositories({
      octokit,
      organizationName: orgName,
    });

    for (const repository of repos) {
      await mirrorGitHubRepoToGiteaOrg({
        octokit,
        config,
        repository,
        giteaOrgId,
      });
    }
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

export async function mirrorGithubOrgRepoIssuesToGiteaOrg({
  config,
  octokit,
  repository,
  orgName,
}: {
  config: Partial<Config>;
  octokit: Octokit;
  repository: any;
  orgName: string;
}) {
  if (!config.giteaConfig?.url || !config.giteaConfig?.token) {
    throw new Error("Gitea config is required.");
  }

  const { data: issues } = await octokit.rest.issues.listForRepo({
    owner: repository.owner.login,
    repo: repository.name,
    state: "all",
    per_page: 100,
  });

  if (issues.length === 0) {
    return;
  }

  // Step 1: Get existing Gitea labels
  const giteaLabelsRes = await fetch(
    `${config.giteaConfig.url}/api/v1/repos/${orgName}/${repository.name}/labels`,
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
      `${config.giteaConfig?.url}/api/v1/repos/${orgName}/${repository.name}/labels`,
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
      `${config.giteaConfig.url}/api/v1/repos/${orgName}/${repository.name}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${config.giteaConfig.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: issue.title,
          body: issue.body || "",
          labels: labelIds, // <-- send label IDs
          closed: issue.state === "closed",
        }),
      }
    );

    if (!createIssueRes.ok) {
      console.error(
        `Failed to create issue "${
          issue.title
        }": ${await createIssueRes.text()}`
      );
    } else {
      console.log(`Created issue "${issue.title}"`);
    }
  }
}
