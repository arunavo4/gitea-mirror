import type { APIRoute } from "astro";
import { Octokit } from "@octokit/rest";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { token, username } = body;

    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "GitHub token is required",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Create an Octokit instance with the provided token
    const octokit = new Octokit({
      auth: token,
    });

    // Test the connection by fetching the authenticated user
    const { data } = await octokit.users.getAuthenticated();

    // Verify that the authenticated user matches the provided username (if provided)
    if (username && data.login !== username) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Token belongs to ${data.login}, not ${username}`,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Return success response with user data
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully connected to GitHub as ${data.login}`,
        user: {
          login: data.login,
          name: data.name,
          avatar_url: data.avatar_url,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("GitHub connection test failed:", error);

    // Handle specific error types
    if (error instanceof Error && (error as any).status === 401) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid GitHub token",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Generic error response
    return new Response(
      JSON.stringify({
        success: false,
        message: `GitHub connection test failed: ${
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
