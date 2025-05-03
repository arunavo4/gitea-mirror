import type { APIRoute } from "astro";
import { db, repositories } from "@/lib/db";
import { eq } from "drizzle-orm";
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
    // Return the latest data from DB
    const rawRepositories = await db
      .select()
      .from(repositories)
      .where(eq(repositories.userId, userId));

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
