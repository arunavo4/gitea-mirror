import type { APIRoute } from "astro";
import { db, repositories, organizations, mirrorJobs, configs } from "@/lib/db";
import { eq, count, and, sql, or } from "drizzle-orm";
import { jsonResponse } from "@/lib/utils";
import type { DashboardApiResponse } from "@/types/dashboard";
import { repositoryVisibilityEnum, repoStatusEnum } from "@/types/Repository";
import { membershipRoleEnum } from "@/types/organizations";

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return jsonResponse({
      data: {
        success: false,
        error: "Missing userId",
      },
      status: 400,
    });
  }

  try {
    const [
      userRepos,
      userOrgs,
      userLogs,
      [userConfig],
      [{ value: repoCount }],
      [{ value: orgCount }],
      [{ value: mirroredCount }],
    ] = await Promise.all([
      db
        .select()
        .from(repositories)
        .where(eq(repositories.userId, userId))
        .orderBy(sql`${repositories.updatedAt} DESC`)
        .limit(10),
      db
        .select()
        .from(organizations)
        .where(eq(organizations.userId, userId))
        .orderBy(sql`${organizations.updatedAt} DESC`)
        .limit(10), // not really needed in the frontend but just in case
      db
        .select()
        .from(mirrorJobs)
        .where(eq(mirrorJobs.userId, userId))
        .orderBy(sql`${mirrorJobs.timestamp} DESC`)
        .limit(10),
      db.select().from(configs).where(eq(configs.userId, userId)).limit(1),
      db
        .select({ value: count() })
        .from(repositories)
        .where(eq(repositories.userId, userId)),
      db
        .select({ value: count() })
        .from(organizations)
        .where(eq(organizations.userId, userId)),
      db
        .select({ value: count() })
        .from(repositories)
        .where(
          and(
            eq(repositories.userId, userId),
            or(
              eq(repositories.status, "mirrored"),
              eq(repositories.status, "synced")
            )
          )
        ),
    ]);

    const successResponse: DashboardApiResponse = {
      success: true,
      message: "Dashboard data loaded successfully",
      repoCount: repoCount ?? 0,
      orgCount: orgCount ?? 0,
      mirroredCount: mirroredCount ?? 0,
      repositories: userRepos.map((repo) => ({
        ...repo,
        organization: repo.organization ?? undefined,
        lastMirrored: repo.lastMirrored ?? undefined,
        errorMessage: repo.errorMessage ?? undefined,
        forkedFrom: repo.forkedFrom ?? undefined,
        status: repoStatusEnum.parse(repo.status),
        visibility: repositoryVisibilityEnum.parse(repo.visibility),
      })),
      organizations: userOrgs.map((org) => ({
        ...org,
        status: repoStatusEnum.parse(org.status),
        membershipRole: membershipRoleEnum.parse(org.membershipRole),
        lastMirrored: org.lastMirrored ?? undefined,
        errorMessage: org.errorMessage ?? undefined,
      })),
      activities: userLogs.map((job) => ({
        id: job.id,
        userId: job.userId,
        repositoryName: job.repositoryName ?? undefined,
        organizationName: job.organizationName ?? undefined,
        status: repoStatusEnum.parse(job.status),
        details: job.details ?? undefined,
        message: job.message,
        timestamp: job.timestamp,
      })),
      lastSync: userConfig?.scheduleConfig.lastRun ?? null,
    };

    return jsonResponse({ data: successResponse });
  } catch (error) {
    console.error("Error loading dashboard for user:", userId, error);

    return jsonResponse({
      data: {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        message: "Failed to fetch dashboard data",
      },
      status: 500,
    });
  }
};
