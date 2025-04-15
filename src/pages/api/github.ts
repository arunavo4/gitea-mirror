import type { APIRoute } from 'astro';
import { db, repositories } from '@/lib/db';
import { eq } from 'drizzle-orm';
import * as github from '@/lib/github';

export const POST: APIRoute = async ({ request }) => {
  const { pathname } = new URL(request.url);
  const endpoint = pathname.split('/').pop();

  try {
    if (endpoint === 'test-connection') {
      return await testConnection(request);
    } else if (endpoint === 'repositories') {
      return await getRepositories(request);
    } else if (endpoint === 'organizations') {
      return await getOrganizations(request);
    } else if (endpoint === 'starred') {
      return await getStarredRepositories(request);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('GitHub API error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

async function testConnection(request: Request) {
  const { token } = await request.json();

  if (!token) {
    return new Response(JSON.stringify({ error: 'GitHub token is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const octokit = github.createGitHubClient(token);
    const { data } = await octokit.users.getAuthenticated();

    return new Response(
      JSON.stringify({
        success: true,
        username: data.login,
        avatarUrl: data.avatar_url,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to GitHub',
      }),
      {
        status: 200, // Still return 200 to allow the frontend to handle the error
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function getRepositories(request: Request) {
  const config = await request.json();

  if (!config.github?.token) {
    return new Response(JSON.stringify({ error: 'GitHub token is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const octokit = github.createGitHubClient(config.github.token);
    const repositories = await github.getUserRepositories(octokit, config);

    // Add IDs to repositories
    const reposWithIds = repositories.map(repo => ({
      ...repo,
      id: crypto.randomUUID(),
    }));

    return new Response(JSON.stringify(reposWithIds), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch repositories' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function getStarredRepositories(request: Request) {
  const config = await request.json();

  if (!config.github?.token) {
    return new Response(JSON.stringify({ error: 'GitHub token is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const octokit = github.createGitHubClient(config.github.token);
    const repositories = await github.getStarredRepositories(octokit, config);

    // Add IDs to repositories
    const reposWithIds = repositories.map(repo => ({
      ...repo,
      id: crypto.randomUUID(),
    }));

    return new Response(JSON.stringify(reposWithIds), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch starred repositories' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function getOrganizations(request: Request) {
  const { token } = await request.json();

  if (!token) {
    return new Response(JSON.stringify({ error: 'GitHub token is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const octokit = github.createGitHubClient(token);
    const orgs = await github.getUserOrganizations(octokit);

    // Add IDs to organizations
    const orgsWithIds = orgs.map(org => ({
      ...org,
      id: crypto.randomUUID(),
      configId: 'default',
      isIncluded: true,
      repositoryCount: 0, // We'll fetch this separately
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return new Response(JSON.stringify(orgsWithIds), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch organizations' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
