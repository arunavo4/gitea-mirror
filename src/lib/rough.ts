// this is a temporary file for testing purposes
import type { Config } from "@/types/config";

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

export async function deleteAllReposInGitea({
  config,
}: {
  config: Partial<Config>;
}) {
  if (!config.giteaConfig?.url || !config.giteaConfig?.token) {
    throw new Error("Gitea config is required.");
  }

  console.log("Fetching all repositories...");

  // Step 1: Get all repositories (user + org repos)
  const repoRes = await fetch(`${config.giteaConfig.url}/api/v1/user/repos`, {
    headers: {
      Authorization: `token ${config.giteaConfig.token}`,
    },
  });

  if (!repoRes.ok) {
    console.error(`Failed to fetch repositories: ${await repoRes.text()}`);
    return;
  }

  const repos = await repoRes.json();

  if (repos.length === 0) {
    console.log("No repositories found to delete.");
    return;
  }

  console.log(`Found ${repos.length} repositories. Starting deletion...`);

  // Step 2: Delete all repositories in parallel
  await Promise.allSettled(
    repos.map((repo: any) =>
      fetch(
        `${config.giteaConfig?.url}/api/v1/repos/${repo.owner.username}/${repo.name}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `token ${config.giteaConfig?.token}`,
          },
        }
      ).then(async (res) => {
        if (!res.ok) {
          console.error(
            `Failed to delete repo ${repo.full_name}: ${await res.text()}`
          );
        } else {
          console.log(`Successfully deleted repo ${repo.full_name}`);
        }
      })
    )
  );

  console.log("Finished deleting all repositories.");
}
