import type { APIRoute } from "astro";
import { db, mirrorJobs, configs } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import type { MirrorJob } from "@/lib/db/schema";
import { repoStatusEnum } from "@/types/Repository";

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing 'userId' in query parameters." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch mirror jobs associated with the user
    const jobs = await db
      .select()
      .from(mirrorJobs)
      .where(eq(mirrorJobs.userId, userId))
      .orderBy(sql`${mirrorJobs.timestamp} DESC`);

    const activities: MirrorJob[] = jobs.map((job) => ({
      id: job.id,
      userId: job.userId,
      repositoryId: job.repositoryId ?? undefined,
      repositoryName: job.repositoryName ?? undefined,
      organizationId: job.organizationId ?? undefined,
      organizationName: job.organizationName ?? undefined,
      status: repoStatusEnum.parse(job.status),
      details: job.details ?? undefined,
      message: job.message,
      timestamp: job.timestamp,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Mirror job activities retrieved successfully.",
        activities,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching mirror job activities:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error ? error.message : "An unknown error occurred.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
