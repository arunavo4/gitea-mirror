import type { APIRoute } from "astro";
import * as gitea from "@/lib/gitea";

export const POST: APIRoute = async ({ request }) => {
  const { pathname } = new URL(request.url);
  const endpoint = pathname.split("/").pop();

  try {
    if (endpoint === "test-connection") {
      return await testConnection(request);
    } else if (endpoint === "create-organization") {
      return await createOrganization(request);
    } else if (endpoint === "create-repository") {
      return await createRepository(request);
    } else {
      return new Response(JSON.stringify({ error: "Invalid endpoint" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Gitea API error:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

async function testConnection(request: Request) {
  const { url, token } = await request.json();

  if (!url || !token) {
    return new Response(
      JSON.stringify({ error: "Gitea URL and token are required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const result = await gitea.testGiteaConnection(url, token);

    return new Response(
      JSON.stringify({
        success: true,
        username: result.username,
        avatarUrl: result.avatarUrl,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to connect to Gitea",
      }),
      {
        status: 200, // Still return 200 to allow the frontend to handle the error
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function createOrganization(request: Request) {
  const { url, token, name, description, visibility } = await request.json();

  if (!url || !token || !name) {
    return new Response(
      JSON.stringify({
        error: "Gitea URL, token, and organization name are required",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const organization = await gitea.createGiteaOrganization(
      url,
      token,
      name,
      description || "",
      visibility || "public"
    );

    return new Response(
      JSON.stringify({
        success: true,
        organization,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create organization",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function createRepository(request: Request) {
  const { url, token, name, description, isPrivate, organization } =
    await request.json();

  if (!url || !token || !name) {
    return new Response(
      JSON.stringify({
        error: "Gitea URL, token, and repository name are required",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const repository = await gitea.createGiteaRepository(
      url,
      token,
      name,
      description || "",
      isPrivate || false,
      organization
    );

    return new Response(
      JSON.stringify({
        success: true,
        repository,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create repository",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
