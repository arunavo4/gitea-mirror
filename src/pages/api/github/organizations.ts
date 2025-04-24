import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { configs } from "@/lib/db";
import { eq } from "drizzle-orm";
import * as github from "@/lib/github";
import type { GiteaConfig, GitHubConfig, ScheduleConfig } from "@/types/config";
import { safeParse } from "@/lib/utils";
import type { OrganizationsApiResponse } from "@/types/organizations";

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

    const rawConfig = userConfig[0];

    // Parsed config with all fields
    const config = {
      ...rawConfig,
      githubConfig: safeParse<GitHubConfig>(rawConfig.githubConfig),
      giteaConfig: safeParse<GiteaConfig>(rawConfig.giteaConfig),
      include: safeParse<string[]>(rawConfig.include) ?? [],
      exclude: safeParse<string[]>(rawConfig.exclude) ?? [],
      scheduleConfig: safeParse<ScheduleConfig>(rawConfig.scheduleConfig),
    };

    if (!config.githubConfig || !config.githubConfig.token) {
      return new Response(
        JSON.stringify({ error: "GitHub token is missing in config" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const octokit = github.createGitHubClient(config.githubConfig.token);
    const orgs = await github.getUserOrganizations(octokit);

    console.log("Fetched organizations:", orgs);

    // Add IDs to organizations
    const orgsWithIds = orgs.map((org) => ({
      ...org,
      id: crypto.randomUUID(),
      configId: "default",
      isIncluded: true,
      repositoryCount: 0, // We'll fetch this separately
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const resPayload: OrganizationsApiResponse = { organizations: orgsWithIds };

    return new Response(JSON.stringify(resPayload), {
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
