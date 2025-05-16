//this is a rough api route that will delete all the orgs and repos in gitea. can be used for some other testing purposes as well

import { configs, db } from "@/lib/db";
import { deleteAllOrgs, deleteAllReposInGitea } from "@/lib/rough";
import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch user configuration
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

    //adjust this based on the orgs you you want to delete
    await deleteAllOrgs({
      config,
      orgs: [
        "Neucruit",
        "initify",
        "BitBustersx719",
        "uiastra",
        "conductor-oss",
        "HackForge-JUSL",
        "vercel",
      ],
    });

    await deleteAllReposInGitea({
      config,
    });

    return new Response(JSON.stringify({ message: "Process completed." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in long-running process:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
