import {
  repoStatusEnum,
  type RepositoryVisibility,
  type RepoStatus,
} from "@/types/Repository";
import { Octokit } from "@octokit/rest";
import type { Config } from "@/types/config";
import type { Organization, Repository } from "./db/schema";
import superagent from "superagent";
import { createMirrorJob } from "./helpers";
import { db, organizations, repositories } from "./db";
import { eq } from "drizzle-orm";

export const isRepoPresentInGitea = async ({
  config,
  owner,
  repoName,
}: {
  config: Partial<Config>;
  owner: string;
  repoName: string;
}): Promise<boolean> => {
  const { url, token } = config.giteaConfig!;
  const apiUrl = `${url}/api/v1/repos/${owner}/${repoName}`;

  const res = await fetch(apiUrl, {
    headers: {
      Authorization: `token ${token}`,
    },
  });

  return res.status === 200;
};

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
    if (!config.userId || !config.githubConfig || !config.giteaConfig) {
      throw new Error("github config and gitea config are required.");
    }

    if (!config.giteaConfig.username) {
      throw new Error("Gitea username is required.");
    }

    const isExisting = await isRepoPresentInGitea({
      config,
      owner: config.giteaConfig.username,
      repoName: repository.name,
    });

    if (isExisting) {
      console.log(
        `Repository ${repository.name} already exists in Gitea. Skipping migration.`
      );
      return;
    }

    console.log(`Mirroring repository ${repository.name}`);

    // Mark repos as "mirroring" in DB
    await db
      .update(repositories)
      .set({
        status: repoStatusEnum.parse("mirroring"),
        updatedAt: new Date(),
      })
      .where(eq(repositories.id, repository.id!));

    // Append log for "mirroring" status
    await createMirrorJob({
      userId: config.userId,
      repositoryName: repository.name,
      message: `Started mirroring repository: ${repository.name}`,
      details: `Repository ${repository.name} is now in the mirroring state.`,
      status: "mirroring",
    });

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
        repo_owner: config.giteaConfig.username,
        description: "",
        service: "git",
      });

    console.log(`Repository ${repository.name} mirrored successfully`);

    // Mark repos as "mirrored" in DB
    await db
      .update(repositories)
      .set({
        status: repoStatusEnum.parse("mirrored"),
        updatedAt: new Date(),
        lastMirrored: new Date(),
        errorMessage: null,
      })
      .where(eq(repositories.id, repository.id!));

    // Append log for "mirrored" status
    await createMirrorJob({
      userId: config.userId,
      repositoryName: repository.name,
      message: `Successfully mirrored repository: ${repository.name}`,
      details: `Repository ${repository.name} was mirrored to Gitea.`,
      status: "mirrored",
    });

    return response.body;
  } catch (error) {
    console.error(
      `Error while mirroring repository ${repository.name}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );

    // Mark repos as "failed" in DB
    await db
      .update(repositories)
      .set({
        status: repoStatusEnum.parse("failed"),
        updatedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(repositories.id, repository.id!));

    // Append log for failure
    await createMirrorJob({
      userId: config.userId ?? "", // userId is going to be there anyways
      repositoryName: repository.name,
      message: `Failed to mirror repository: ${repository.name}`,
      details: `Repository ${repository.name} failed to mirror. Error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      status: "failed",
    });
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

      await createMirrorJob({
        userId: config.userId,
        organizationName: orgName,
        status: "imported",
        message: `Organization ${orgName} fetched successfully`,
        details: `Organization ${orgName} was fetched from GitHub`,
      });
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
      message: `Organization ${orgName} created successfully`,
      details: `Organization ${orgName} was created in Gitea`,
    });

    const newOrg = await createRes.json();
    return newOrg.id;
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error occurred in getOrCreateGiteaOrg.";

    await createMirrorJob({
      userId: config.userId,
      organizationName: orgName,
      message: `Failed to create or fetch Gitea organization: ${orgName}`,
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
  orgName,
}: {
  octokit: Octokit;
  config: Partial<Config>;
  repository: Repository;
  giteaOrgId: number;
  orgName: string;
}) {
  try {
    if (
      !config.giteaConfig?.url ||
      !config.giteaConfig?.token ||
      !config.userId
    ) {
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

    console.log(
      `Mirroring repository ${repository.name} to organization ${orgName}`
    );

    // Mark repos as "mirroring" in DB
    await db
      .update(repositories)
      .set({
        status: repoStatusEnum.parse("mirroring"),
        updatedAt: new Date(),
      })
      .where(eq(repositories.id, repository.id!));

    // Append log for "mirroring" status
    await createMirrorJob({
      userId: config.userId,
      repositoryName: repository.name,
      message: `Started mirroring repository: ${repository.name}`,
      details: `Repository ${repository.name} is now in the mirroring state.`,
      status: "mirroring",
    });

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

    console.log(
      `Repository ${repository.name} mirrored successfully to organization ${orgName}`
    );

    // Mark repos as "mirrored" in DB
    await db
      .update(repositories)
      .set({
        status: repoStatusEnum.parse("mirrored"),
        updatedAt: new Date(),
        lastMirrored: new Date(),
        errorMessage: null,
      })
      .where(eq(repositories.id, repository.id!));

    //create a mirror job
    await createMirrorJob({
      userId: config.userId,
      repositoryName: repository.name,
      message: `Repository ${repository.name} mirrored successfully`,
      details: `Repository ${repository.name} was mirrored to Gitea`,
      status: "mirrored",
    });

    // After migrating the repository, clone issues
    // await mirrorGithubOrgRepoIssuesToGiteaOrg({
    //   config,
    //   octokit,
    //   repository,
    //   orgName,
    // });
  } catch (error) {
    console.error(
      `Error while mirroring repository ${repository.name}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    // Mark repos as "failed" in DB
    await db
      .update(repositories)
      .set({
        status: repoStatusEnum.parse("failed"),
        updatedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(repositories.id, repository.id!));

    // Append log for failure
    await createMirrorJob({
      userId: config.userId || "", // userId is going to be there anyways
      repositoryName: repository.name,
      message: `Failed to mirror repository: ${repository.name}`,
      details: `Repository ${repository.name} failed to mirror. Error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      status: "failed",
    });
    console.log("issue in up func");
    if (error instanceof Error) {
      throw new Error(`Failed to mirror repository: ${error.message}`);
    }
    throw new Error("Failed to mirror repository: An unknown error occurred.");
  }
}

export async function mirrorGitHubOrgRepoToGiteaOrg({
  config,
  octokit,
  repository,
  orgName,
}: {
  config: Partial<Config>;
  octokit: Octokit;
  repository: Repository;
  orgName: string;
}) {
  try {
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
      orgName,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to mirror repository: ${error.message}`);
    }
    throw new Error("Failed to mirror repository: An unknown error occurred.");
  }
}

export async function mirrorGitHubOrgToGitea({
  organization,
  octokit,
  config,
}: {
  organization: Organization;
  octokit: Octokit;
  config: Partial<Config>;
}) {
  try {
    if (
      !config.userId ||
      !config.id ||
      !config.githubConfig?.token ||
      !config.giteaConfig?.url
    ) {
      throw new Error("Config, GitHub token and Gitea URL are required.");
    }

    console.log(`Mirroring organization ${organization.name}`);

    //mark the org as "mirroring" in DB
    await db
      .update(organizations)
      .set({
        isIncluded: true,
        status: repoStatusEnum.parse("mirroring"),
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organization.id!));

    // Append log for "mirroring" status
    await createMirrorJob({
      userId: config.userId,
      organizationName: organization.name,
      message: `Started mirroring organization: ${organization.name}`,
      details: `Organization ${organization.name} is now in the mirroring state.`,
      status: repoStatusEnum.parse("mirroring"),
    });

    const giteaOrgId = await getOrCreateGiteaOrg({
      orgName: organization.name,
      config,
    });

    //query the db with the org name and get the repos
    const orgRepos = await db
      .select()
      .from(repositories)
      .where(eq(repositories.organization, organization.name));

    console.log(`Found ${orgRepos}`);

    for (const repo of orgRepos) {
      await mirrorGitHubRepoToGiteaOrg({
        octokit,
        config,
        repository: {
          ...repo,
          status: repo.status as RepoStatus,
          visibility: repo.visibility as RepositoryVisibility,
          lastMirrored: repo.lastMirrored ?? undefined,
          errorMessage: repo.errorMessage ?? undefined,
          organization: repo.organization ?? undefined,
          forkedFrom: repo.forkedFrom ?? undefined,
        },
        giteaOrgId,
        orgName: organization.name,
      });
    }

    console.log(`Organization ${organization.name} mirrored successfully`);

    // Mark org as "mirrored" in DB
    await db
      .update(organizations)
      .set({
        status: repoStatusEnum.parse("mirrored"),
        updatedAt: new Date(),
        lastMirrored: new Date(),
        errorMessage: null,
      })
      .where(eq(organizations.id, organization.id!));

    // Append log for "mirrored" status
    await createMirrorJob({
      userId: config.userId,
      organizationName: organization.name,
      message: `Successfully mirrored organization: ${organization.name}`,
      details: `Organization ${organization.name} was mirrored to Gitea.`,
      status: repoStatusEnum.parse("mirrored"),
    });
  } catch (error) {
    console.error(
      `Error while mirroring organization ${organization.name}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );

    // Mark org as "failed" in DB
    await db
      .update(organizations)
      .set({
        status: repoStatusEnum.parse("failed"),
        updatedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(organizations.id, organization.id!));

    // Append log for failure
    await createMirrorJob({
      userId: config.userId || "", // userId is going to be there anyways
      organizationName: organization.name,
      message: `Failed to mirror organization: ${organization.name}`,
      details: `Organization ${organization.name} failed to mirror. Error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      status: repoStatusEnum.parse("failed"),
    });

    console.log("issue in down func");

    if (error instanceof Error) {
      throw new Error(`Failed to mirror repository: ${error.message}`);
    }
    throw new Error("Failed to mirror repository: An unknown error occurred.");
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
