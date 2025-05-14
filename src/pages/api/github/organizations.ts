import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import {
  membershipRoleEnum,
  type OrganizationsApiResponse,
} from "@/types/organizations";
import type { Organization } from "@/lib/db/schema";
import { repoStatusEnum } from "@/types/Repository";
import { jsonResponse } from "@/lib/utils";

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
    const rawOrgs = await db
      .select()
      .from(organizations)
      .where(eq(organizations.userId, userId))
      .orderBy(sql`name COLLATE NOCASE`);

    const orgsWithIds: Organization[] = rawOrgs.map((org) => ({
      ...org,
      status: repoStatusEnum.parse(org.status),
      membershipRole: membershipRoleEnum.parse(org.membershipRole),
      lastMirrored: org.lastMirrored ?? undefined,
      errorMessage: org.errorMessage ?? undefined,
    }));

    const resPayload: OrganizationsApiResponse = {
      success: true,
      message: "Organizations fetched successfully",
      organizations: orgsWithIds,
    };

    return jsonResponse({ data: resPayload, status: 200 });
  } catch (error) {
    console.error("Error fetching organizations:", error);

    return jsonResponse({
      data: {
        success: false,
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      status: 500,
    });
  }
};
