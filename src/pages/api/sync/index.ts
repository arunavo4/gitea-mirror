import type { APIRoute } from "astro";
import { db, organizations, repositories, configs } from "@/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { createMirrorJob } from "@/lib/helpers";
import {
  createGitHubClient,
  getGithubOrganizations,
  getGithubRepositories,
  getGithubStarredRepositories,
} from "@/lib/github";
import { jsonResponse } from "@/lib/utils";

export const POST: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");

  if (!userId)
    return jsonResponse({ data: { error: "Missing userId" }, status: 400 });

  try {
    const [config] = await db
      .select()
      .from(configs)
      .where(eq(configs.userId, userId))
      .limit(1);

    if (!config)
      return jsonResponse({
        data: { error: "No configuration found for this user" },
        status: 404,
      });

    const token = config.githubConfig?.token;

    if (!token) {
      return jsonResponse({
        data: { error: "GitHub token is missing in config" },
        status: 400,
      });
    }

    const octokit = createGitHubClient(token);

    const [basicAndForkedRepos, starredRepos, gitOrgs] = await Promise.all([
      getGithubRepositories({ octokit, config }),
      getGithubStarredRepositories({ octokit, config }),
      getGithubOrganizations({ octokit, config }),
    ]);

    const allGithubRepos = [...basicAndForkedRepos, ...starredRepos];

    const [existingRepos, existingOrgs] = await Promise.all([
      db.select().from(repositories).where(eq(repositories.userId, userId)),
      db.select().from(organizations).where(eq(organizations.userId, userId)),
    ]);

    const existingRepoMap = new Map(existingRepos.map((r) => [r.fullName, r]));
    const existingOrgMap = new Map(existingOrgs.map((o) => [o.name, o]));

    const newRepos = [];
    const updatedRepoIds: string[] = [];
    const repoMirrorJobs = [];

    for (const repo of allGithubRepos) {
      const existing = existingRepoMap.get(repo.fullName);

      if (!existing) {
        const repoId = uuidv4();

        newRepos.push({
          id: repoId,
          userId,
          configId: config.id,
          name: repo.name,
          fullName: repo.fullName,
          url: repo.url,
          cloneUrl: repo.cloneUrl,
          owner: repo.owner,
          organization: repo.organization,
          isPrivate: repo.isPrivate,
          isForked: repo.isForked,
          forkedFrom: repo.forkedFrom,
          hasIssues: repo.hasIssues,
          isStarred: repo.isStarred,
          isArchived: repo.isArchived,
          size: repo.size,
          hasLFS: repo.hasLFS,
          hasSubmodules: repo.hasSubmodules,
          defaultBranch: repo.defaultBranch,
          visibility: repo.visibility,
          status: repo.status,
          lastMirrored: repo.lastMirrored,
          errorMessage: repo.errorMessage,
          createdAt: repo.createdAt,
          updatedAt: repo.updatedAt,
        });

        repoMirrorJobs.push(
          createMirrorJob({
            userId,
            repositoryName: repo.name,
            status: "imported",
            message: `Repository ${repo.name} fetched successfully`,
            details: `Repository ${repo.name} was fetched from GitHub`,
          })
        );
      } else {
        updatedRepoIds.push(existing.id);
      }
    }

    if (newRepos.length > 0) await db.insert(repositories).values(newRepos);
    if (updatedRepoIds.length > 0) {
      await Promise.all(
        updatedRepoIds.map((id) =>
          db
            .update(repositories)
            .set({ updatedAt: new Date() })
            .where(eq(repositories.id, id))
        )
      );
    }

    const newOrgs = [];
    const updatedOrgOps = [];
    const orgMirrorJobs = [];

    for (const org of gitOrgs) {
      const existing = existingOrgMap.get(org.name);

      if (!existing) {
        newOrgs.push({
          id: uuidv4(),
          userId,
          configId: config.id,
          name: org.name,
          avatarUrl: org.avatarUrl,
          membershipRole: org.membershipRole,
          isIncluded: false,
          status: org.status,
          repositoryCount: org.repositoryCount,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        orgMirrorJobs.push(
          createMirrorJob({
            userId,
            organizationName: org.name,
            status: "imported",
            message: `Organization ${org.name} fetched successfully`,
            details: `Organization ${org.name} was fetched from GitHub`,
          })
        );
      } else {
        updatedOrgOps.push(
          db
            .update(organizations)
            .set({ ...org, updatedAt: new Date() })
            .where(eq(organizations.id, existing.id))
        );
      }
    }

    if (newOrgs.length > 0) await db.insert(organizations).values(newOrgs);
    if (updatedOrgOps.length > 0) await Promise.all(updatedOrgOps);

    await Promise.all([...repoMirrorJobs, ...orgMirrorJobs]);

    return jsonResponse({
      data: {
        success: true,
        message: "Repositories and organizations synced successfully",
      },
    });
  } catch (error) {
    console.error("Error syncing GitHub data for user:", userId, error);
    return jsonResponse({
      data: {
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      status: 500,
    });
  }
};
