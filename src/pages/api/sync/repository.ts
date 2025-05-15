import type { APIRoute } from "astro";
import { Octokit } from "@octokit/rest";
import { configs, db, repositories } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { and, eq } from "drizzle-orm";
import { type Repository } from "@/lib/db/schema";
import { jsonResponse } from "@/lib/utils";
import type {
  AddRepositoriesApiRequest,
  AddRepositoriesApiResponse,
  RepositoryVisibility,
} from "@/types/Repository";
import { createMirrorJob } from "@/lib/helpers";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: AddRepositoriesApiRequest = await request.json();
    const { owner, repo, userId } = body;

    if (!owner || !repo || !userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing owner, repo, or userId",
        }),
        { status: 400 }
      );
    }

    // Check if repository with the same owner, name, and userId already exists
    const existingRepo = await db
      .select()
      .from(repositories)
      .where(
        and(
          eq(repositories.owner, owner),
          eq(repositories.name, repo),
          eq(repositories.userId, userId)
        )
      );

    if (existingRepo.length > 0) {
      return jsonResponse({
        data: {
          success: false,
          error:
            "Repository with this name and owner already exists for this user",
        },
        status: 400,
      });
    }

    // Get user's active config
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

    const configId = config.id;

    const octokit = new Octokit(); // No auth for public repos

    const { data: repoData } = await octokit.rest.repos.get({ owner, repo });

    const metadata = {
      id: uuidv4(),
      userId,
      configId,
      name: repoData.name,
      fullName: repoData.full_name,
      url: repoData.html_url,
      cloneUrl: repoData.clone_url,
      owner: repoData.owner.login,
      organization:
        repoData.owner.type === "Organization"
          ? repoData.owner.login
          : undefined,
      isPrivate: repoData.private,
      isForked: repoData.fork,
      forkedFrom: undefined,
      hasIssues: repoData.has_issues,
      isStarred: false,
      isArchived: repoData.archived,
      size: repoData.size,
      hasLFS: false,
      hasSubmodules: false,
      defaultBranch: repoData.default_branch,
      visibility: (repoData.visibility ?? "public") as RepositoryVisibility,
      status: "imported" as Repository["status"],
      lastMirrored: undefined,
      errorMessage: undefined,
      createdAt: repoData.created_at
        ? new Date(repoData.created_at)
        : new Date(),
      updatedAt: repoData.updated_at
        ? new Date(repoData.updated_at)
        : new Date(),
    };

    await db.insert(repositories).values(metadata);

    createMirrorJob({
      userId,
      organizationId: metadata.organization,
      organizationName: metadata.organization,
      repositoryId: metadata.id,
      repositoryName: metadata.name,
      status: "imported",
      message: `Repository ${metadata.name} fetched successfully`,
      details: `Repository ${metadata.name} was fetched from GitHub`,
    });

    const resPayload: AddRepositoriesApiResponse = {
      success: true,
      repository: metadata,
      message: "Repository added successfully",
    };

    return jsonResponse({ data: resPayload, status: 200 });
  } catch (error) {
    console.error("Error inserting repository:", error);
    return jsonResponse({
      data: {
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      status: 500,
    });
  }
};
