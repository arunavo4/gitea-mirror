import type { APIRoute } from "astro";
import { db, configs, users } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { githubConfig, giteaConfig, scheduleConfig } = body;

    if (!githubConfig || !giteaConfig || !scheduleConfig) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "All configuration sections are required",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Preserve existing tokens if they're empty in the new config
    // This prevents tokens from being lost when the form is submitted with empty token fields
    try {
      const existingConfig = await db.select().from(configs).limit(1);
      if (existingConfig.length > 0) {
        const existing = existingConfig[0];

        // Parse existing configs
        const existingGithubConfig =
          typeof existing.githubConfig === "string"
            ? JSON.parse(existing.githubConfig)
            : existing.githubConfig;

        const existingGiteaConfig =
          typeof existing.giteaConfig === "string"
            ? JSON.parse(existing.giteaConfig)
            : existing.giteaConfig;

        // If new GitHub token is empty but we have an existing one, use the existing one
        if (!githubConfig.token && existingGithubConfig.token) {
          githubConfig.token = existingGithubConfig.token;
        }

        // If new Gitea token is empty but we have an existing one, use the existing one
        if (!giteaConfig.token && existingGiteaConfig.token) {
          giteaConfig.token = existingGiteaConfig.token;
        }
      }
    } catch (tokenError) {
      console.error("Error preserving existing tokens:", tokenError);
      // Continue with save operation even if token preservation fails
    }

    // Get the first user (for now, we'll associate the config with the first user)
    const firstUser = await db.select().from(users).limit(1);
    if (firstUser.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No users found in the database",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const userId = firstUser[0].id;

    // Check if a config already exists
    const existingConfig = await db.select().from(configs).limit(1);

    if (existingConfig.length > 0) {
      // Update existing config
      const configId = existingConfig[0].id;
      await db
        .update(configs)
        .set({
          githubConfig,
          giteaConfig,
          scheduleConfig,
          updatedAt: new Date(),
        })
        .where(eq(configs.id, configId));

      return new Response(
        JSON.stringify({
          success: true,
          message: "Configuration updated successfully",
          configId,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } else {
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
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  } catch (error) {
    console.error("Error saving configuration:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: `Error saving configuration: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
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
      return new Response(
        JSON.stringify({ error: "Configuration not found" }),
        {
          status: 404,
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
