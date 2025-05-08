import type { APIRoute } from "astro";
import { db, organizations, repositories, configs, mirrorJobs } from "@/lib/db";
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

  if (!userId) {
    return jsonResponse({ data: { error: "Missing userId" }, status: 400 });
  }

  try {
    const [config] = await db
      .select()
      .from(configs)
      .where(eq(configs.userId, userId))
      .limit(1);

    if (!config) {
      return jsonResponse({
        data: { error: "No configuration found for this user" },
        status: 404,
      });
    }

    const token = config.githubConfig?.token;

    if (!token) {
      return jsonResponse({
        data: { error: "GitHub token is missing in config" },
        status: 400,
      });
    }

    const octokit = createGitHubClient(token);

    // Fetch all GitHub data in parallel
    const [basicAndForkedRepos, starredRepos, gitOrgs] = await Promise.all([
      getGithubRepositories({ octokit, config }),
      config.githubConfig?.mirrorStarred
        ? getGithubStarredRepositories({ octokit, config })
        : Promise.resolve([]),
      getGithubOrganizations({ octokit, config }),
    ]);

    // Combine all repositories and organizations after deduplication (if a repo is present in both starred and basic repos, take item from the starred array is ignored and is taken from the basic array)
    // const repoMap = new Map<string, GitRepo>();

    // [...basicAndForkedRepos, ...starredRepos].forEach((repo) => {
    //   const normalizedRepo = {
    //     ...repo,
    //     status: repo.status as GitRepo["status"],
    //   };
    //   if (!repoMap.has(repo.fullName)) {
    //     repoMap.set(repo.fullName, normalizedRepo);
    //   }
    // });

    // const allGithubRepos = Array.from(repoMap.values());

    const allGithubRepos = [...basicAndForkedRepos, ...starredRepos];

    // Prepare new repositories and organizations
    const newRepos = allGithubRepos.map((repo) => ({
      id: uuidv4(),
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
    }));

    const newOrgs = gitOrgs.map((org) => ({
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
    }));

    // Perform everything in a single transaction
    await db.transaction(async (tx) => {
      // Clean old data
      await tx.delete(repositories).where(eq(repositories.userId, userId));
      await tx.delete(organizations).where(eq(organizations.userId, userId));
      await tx.delete(mirrorJobs).where(eq(mirrorJobs.userId, userId));

      // Insert new data
      if (newRepos.length > 0) await tx.insert(repositories).values(newRepos);
      if (newOrgs.length > 0) await tx.insert(organizations).values(newOrgs);
    });

    // Mirror jobs (can happen outside of transaction)
    const mirrorJobPromises = [
      ...newRepos.map((repo) =>
        createMirrorJob({
          userId,
          repositoryId: repo.id,
          repositoryName: repo.name,
          status: "imported",
          message: `Repository ${repo.name} fetched successfully`,
          details: `Repository ${repo.name} was fetched from GitHub`,
        })
      ),
      ...newOrgs.map((org) =>
        createMirrorJob({
          userId,
          organizationId: org.id,
          organizationName: org.name,
          status: "imported",
          message: `Organization ${org.name} fetched successfully`,
          details: `Organization ${org.name} was fetched from GitHub`,
        })
      ),
    ];

    await Promise.all(mirrorJobPromises);

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
