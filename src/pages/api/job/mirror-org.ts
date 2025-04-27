import type { APIRoute } from "astro";
import type { MirrorOrgRequest } from "@/types/mirror";
import { db, configs } from "@/lib/db";
import { eq } from "drizzle-orm";
import { createGitHubClient } from "@/lib/github";
import { mirrorGithubOrgToGitea } from "@/lib/gitea";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: MirrorOrgRequest = await request.json();
    const { userId, organizationIds } = body;

    if (!userId || !organizationIds || !Array.isArray(organizationIds)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "userId and organizationIds are required.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (organizationIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No organization IDs provided.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch config
    const configResult = await db
      .select()
      .from(configs)
      .where(eq(configs.userId, userId))
      .limit(1);

    const config = configResult[0];

    if (!config || !config.githubConfig.token) {
      return new Response(
        JSON.stringify({ error: "Config missing for the user." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch repos
    const octokit = createGitHubClient(config.githubConfig.token);

    const response = await mirrorGithubOrgToGitea({
      octokit,
      config,
      orgName: "initify",
    });

    // 4. Return the updated repo list to the user
    return new Response(
      JSON.stringify({
        success: true,
        message: "Mirror job started",
        data: response,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in /api/job/mirror:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
