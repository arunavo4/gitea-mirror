import type { APIRoute } from 'astro';
import axios from 'axios';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { url, token, username } = body;

    if (!url || !token) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Gitea URL and token are required',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Normalize the URL (remove trailing slash if present)
    const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;

    // Test the connection by fetching the authenticated user
    const response = await axios.get(`${baseUrl}/api/v1/user`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/json',
      },
    });

    const data = response.data;

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
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Return success response with user data
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully connected to Gitea as ${data.login}`,
        user: {
          login: data.login,
          name: data.full_name,
          avatar_url: data.avatar_url,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Gitea connection test failed:', error);

    // Handle specific error types
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 401) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Invalid Gitea token',
          }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      } else if (error.response.status === 404) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Gitea API endpoint not found. Please check the URL.',
          }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // Handle connection errors
    if (axios.isAxiosError(error) && (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND')) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Could not connect to Gitea server. Please check the URL.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Generic error response
    return new Response(
      JSON.stringify({
        success: false,
        message: `Gitea connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
