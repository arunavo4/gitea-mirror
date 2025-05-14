import type { APIRoute } from "astro";
import { db, repositories, configs } from "@/lib/db";
import { and, eq, sql } from "drizzle-orm";
import {
  repositoryVisibilityEnum,
  repoStatusEnum,
  type RepositoryApiResponse,
} from "@/types/Repository";
import { jsonResponse } from "@/lib/utils";

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return jsonResponse({
      data: { success: false, error: "Missing userId" },
      status: 400,
    });
  }

  try {
    // Fetch the user's active configuration
    const [config] = await db
      .select()
      .from(configs)
      .where(and(eq(configs.userId, userId), eq(configs.isActive, true)));

    if (!config) {
      return jsonResponse({
        data: {
          success: false,
          error: "No active configuration found for this user",
        },
        status: 404,
      });
    }

    const githubConfig = config.githubConfig as {
      mirrorStarred: boolean;
      skipForks: boolean;
      privateRepositories: boolean;
    };

    // Build query conditions based on config
    const conditions = [eq(repositories.userId, userId)];

    if (!githubConfig.mirrorStarred) {
      conditions.push(eq(repositories.isStarred, false));
    }

    if (githubConfig.skipForks) {
      conditions.push(eq(repositories.isForked, false));
    }

    if (!githubConfig.privateRepositories) {
      conditions.push(eq(repositories.isPrivate, false));
    }

    const rawRepositories = await db
      .select()
      .from(repositories)
      .where(and(...conditions))
      .orderBy(sql`name COLLATE NOCASE`);

    const response: RepositoryApiResponse = {
      success: true,
      message: "Repositories fetched successfully",
      repositories: rawRepositories.map((repo) => ({
        ...repo,
        organization: repo.organization ?? undefined,
        lastMirrored: repo.lastMirrored ?? undefined,
        errorMessage: repo.errorMessage ?? undefined,
        forkedFrom: repo.forkedFrom ?? undefined,
        status: repoStatusEnum.parse(repo.status),
        visibility: repositoryVisibilityEnum.parse(repo.visibility),
      })),
    };

    return jsonResponse({
      data: response,
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching repositories:", error);

    return jsonResponse({
      data: {
        success: false,
        error: error instanceof Error ? error.message : "Something went wrong",
        message: "An error occurred while fetching repositories.",
      },
      status: 500,
    });
  }
};
