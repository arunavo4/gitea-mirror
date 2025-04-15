import type { APIRoute } from 'astro';
import { db, mirrorJobs, repositories, configs } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { mirrorAllRepositories, mirrorSingleRepository, syncRepositories } from '@/lib/mirror';

export const POST: APIRoute = async ({ request }) => {
  const { pathname } = new URL(request.url);
  const endpoint = pathname.split('/').pop();

  try {
    if (endpoint === 'start') {
      return await startMirror(request);
    } else if (endpoint === 'sync') {
      return await syncRepositoriesEndpoint(request);
    } else if (endpoint?.includes('cancel')) {
      const jobId = pathname.split('/').slice(-2)[0];
      return await cancelMirrorJob(jobId);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Mirror API error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const GET: APIRoute = async ({ request }) => {
  const { pathname } = new URL(request.url);
  const segments = pathname.split('/');
  const endpoint = segments[segments.length - 2];
  const id = segments[segments.length - 1];

  try {
    if (endpoint === 'jobs') {
      return await getMirrorJobs(id);
    } else if (endpoint === 'job') {
      return await getMirrorJob(id);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Mirror API error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

async function startMirror(request: Request) {
  const { configId, repositoryIds } = await request.json();

  if (!configId) {
    return new Response(JSON.stringify({ error: 'Config ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get the configuration
    const config = await db.select().from(configs).where(eq(configs.id, configId)).limit(1);

    if (!config.length) {
      return new Response(JSON.stringify({ error: 'Configuration not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create a new mirror job
    const jobId = crypto.randomUUID();
    const now = new Date();

    const job = {
      id: jobId,
      configId,
      status: 'pending',
      startedAt: now,
      log: JSON.stringify([
        {
          timestamp: now,
          message: 'Mirror job started',
          level: 'info',
        },
      ]),
      createdAt: now,
      updatedAt: now,
    };

    if (repositoryIds && repositoryIds.length === 1) {
      job.repositoryId = repositoryIds[0];
    }

    await db.insert(mirrorJobs).values(job);

    // Start the mirroring process in the background
    if (repositoryIds && repositoryIds.length === 1) {
      // Mirror a single repository
      const repository = await db.select()
        .from(repositories)
        .where(eq(repositories.id, repositoryIds[0]))
        .limit(1);

      if (repository.length) {
        // Start mirroring in the background
        setTimeout(async () => {
          try {
            await mirrorSingleRepository(config[0], repository[0], jobId);
          } catch (error) {
            console.error('Error mirroring repository:', error);
          }
        }, 0);
      }
    } else {
      // Mirror all repositories
      setTimeout(async () => {
        try {
          await mirrorAllRepositories(config[0], jobId);
        } catch (error) {
          console.error('Error mirroring repositories:', error);
        }
      }, 0);
    }

    return new Response(
      JSON.stringify({
        id: jobId,
        configId,
        status: 'pending',
        startedAt: now,
        log: [
          {
            timestamp: now,
            message: 'Mirror job started',
            level: 'info',
          },
        ],
        createdAt: now,
        updatedAt: now,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to start mirror job' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function syncRepositoriesEndpoint(request: Request) {
  const { configId } = await request.json();

  if (!configId) {
    return new Response(JSON.stringify({ error: 'Config ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get the configuration
    const config = await db.select().from(configs).where(eq(configs.id, configId)).limit(1);

    if (!config.length) {
      return new Response(JSON.stringify({ error: 'Configuration not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Sync repositories
    const result = await syncRepositories(config[0]);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to sync repositories' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function getMirrorJobs(configId: string) {
  try {
    const jobs = await db.select().from(mirrorJobs).where(eq(mirrorJobs.configId, configId));

    // Parse the log JSON for each job
    const jobsWithParsedLogs = jobs.map(job => ({
      ...job,
      log: JSON.parse(job.log),
    }));

    return new Response(JSON.stringify(jobsWithParsedLogs), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to get mirror jobs' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function getMirrorJob(jobId: string) {
  try {
    const job = await db.select().from(mirrorJobs).where(eq(mirrorJobs.id, jobId)).limit(1);

    if (!job.length) {
      return new Response(JSON.stringify({ error: 'Mirror job not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse the log JSON
    const jobWithParsedLog = {
      ...job[0],
      log: JSON.parse(job[0].log),
    };

    return new Response(JSON.stringify(jobWithParsedLog), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to get mirror job' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function cancelMirrorJob(jobId: string) {
  try {
    const job = await db.select().from(mirrorJobs).where(eq(mirrorJobs.id, jobId)).limit(1);

    if (!job.length) {
      return new Response(JSON.stringify({ error: 'Mirror job not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (job[0].status !== 'pending' && job[0].status !== 'running') {
      return new Response(JSON.stringify({ error: 'Cannot cancel a job that is not pending or running' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse the log JSON
    const log = JSON.parse(job[0].log);
    const now = new Date();

    // Add a log entry for the cancellation
    log.push({
      timestamp: now,
      message: 'Mirror job cancelled by user',
      level: 'info',
    });

    // Update the job status
    await db.update(mirrorJobs)
      .set({
        status: 'failed',
        completedAt: now,
        log: JSON.stringify(log),
        updatedAt: now,
      })
      .where(eq(mirrorJobs.id, jobId));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to cancel mirror job' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
