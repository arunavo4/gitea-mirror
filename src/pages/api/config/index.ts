import type { APIRoute } from "astro";
import { db, configs, users } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { userId, githubConfig, giteaConfig, scheduleConfig } = body;

    if (!userId || !githubConfig || !giteaConfig || !scheduleConfig) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "userId, githubConfig, giteaConfig, and scheduleConfig are required.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch existing config
    const existingConfigResult = await db
      .select()
      .from(configs)
      .where(eq(configs.userId, userId))
      .limit(1);

    const existingConfig = existingConfigResult[0];

    // Preserve tokens if fields are empty
    if (existingConfig) {
      try {
        const existingGithub =
          typeof existingConfig.githubConfig === "string"
            ? JSON.parse(existingConfig.githubConfig)
            : existingConfig.githubConfig;

        const existingGitea =
          typeof existingConfig.giteaConfig === "string"
            ? JSON.parse(existingConfig.giteaConfig)
            : existingConfig.giteaConfig;

        if (!githubConfig.token && existingGithub.token) {
          githubConfig.token = existingGithub.token;
        }

        if (!giteaConfig.token && existingGitea.token) {
          giteaConfig.token = existingGitea.token;
        }
      } catch (tokenError) {
        console.error("Failed to preserve tokens:", tokenError);
      }
    }

    if (existingConfig) {
      // Update path
      await db
        .update(configs)
        .set({
          githubConfig,
          giteaConfig,
          scheduleConfig,
          updatedAt: new Date(),
        })
        .where(eq(configs.id, existingConfig.id));

      return new Response(
        JSON.stringify({
          success: true,
          message: "Configuration updated successfully",
          configId: existingConfig.id,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fallback user check (optional if you're always passing userId)
    const userExists = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid userId. No matching user found.",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create new config
    const configId = uuidv4();
    await db.insert(configs).values({
      id: configId,
      userId,
      name: "Default Configuration",
      isActive: true,
      githubConfig,
      giteaConfig,
      include: [],
      exclude: [],
      scheduleConfig,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Configuration created successfully",
        configId,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error saving configuration:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message:
          "Error saving configuration: " +
          (error instanceof Error ? error.message : "Unknown error"),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch the configuration for the user
    const config = await db
      .select()
      .from(configs)
      .where(eq(configs.userId, userId))
      .limit(1);

    if (config.length === 0) {
      // Return a default empty configuration instead of a 404 error
      return new Response(
        JSON.stringify({
          id: null,
          userId: userId,
          name: "Default Configuration",
          isActive: true,
          githubConfig: {
            username: "",
            token: "",
            skipForks: false,
            privateRepositories: false,
            mirrorIssues: false,
            mirrorStarred: true,
            useSpecificUser: false,
            preserveOrgStructure: true,
            skipStarredIssues: false,
          },
          giteaConfig: {
            url: "",
            token: "",
            username: "",
            organization: "github-mirrors",
            visibility: "public",
            starredReposOrg: "github",
          },
          scheduleConfig: {
            enabled: false,
            interval: 3600,
            lastRun: null,
            nextRun: null,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(config[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching configuration:", error);

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
