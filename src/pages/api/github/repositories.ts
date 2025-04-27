import type { APIRoute } from "astro";
import { db, repositories } from "@/lib/db";
import { configs } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  repositoryVisibilityEnum,
  repoStatusEnum,
  type RepositoryApiResponse,
} from "@/types/Repository";
import { v4 as uuidv4 } from "uuid";
import { createMirrorJob } from "@/lib/helpers";
import { createGitHubClient, getGithubRepositories } from "@/lib/github";

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const userConfig = await db
      .select()
      .from(configs)
      .where(eq(configs.userId, userId))
      .limit(1);

    if (userConfig.length === 0) {
      return new Response(
        JSON.stringify({ error: "No configuration found for this user" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const config = userConfig[0];

    if (!config.githubConfig || !config.githubConfig.token) {
      return new Response(
        JSON.stringify({ error: "GitHub token is missing in config" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create GitHub client
    const octokit = createGitHubClient(config.githubConfig.token);

    // Fetch GitHub repositories based on the user's config
    const githubRepos = await getGithubRepositories({ octokit, config });

    // Fetch all the repositories of the user from the database
    const existingRepos = await db
      .select()
      .from(repositories)
      .where(eq(repositories.userId, userId));

    // Sync to DB (Insert or Update)
    for (const repo of githubRepos) {
      const existing = existingRepos.find((r) => r.fullName === repo.fullName);

      if (!existing) {
        const repoId = uuidv4();

        await db.insert(repositories).values({
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

        // Create a mirror job for the newly added repository
        await createMirrorJob({
          userId,
          repositoryName: repo.name,
          message: `Repository ${repo.name} fetched successfully`,
          status: "imported",
          details: `Repository ${repo.name} was fetched from GitHub`,
        });
      } else {
        await db
          .update(repositories)
          .set({ updatedAt: new Date() })
          .where(eq(repositories.id, existing.id));
      }
    }

    // Return the latest data from DB
    const latestRepositories = await db
      .select()
      .from(repositories)
      .where(eq(repositories.userId, userId));

    const response: RepositoryApiResponse = {
      repositories: latestRepositories.map((repo) => ({
        ...repo,
        organization: repo.organization ?? undefined,
        lastMirrored: repo.lastMirrored ?? undefined,
        errorMessage: repo.errorMessage ?? undefined,
        forkedFrom: repo.forkedFrom ?? undefined,
        status: repoStatusEnum.parse(repo.status),
        visibility: repositoryVisibilityEnum.parse(repo.visibility),
      })),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching configs:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Something went wrong",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
