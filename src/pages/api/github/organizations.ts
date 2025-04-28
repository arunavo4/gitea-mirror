import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { configs, organizations } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  membershipRoleEnum,
  type OrganizationsApiResponse,
} from "@/types/organizations";
import { v4 as uuidv4 } from "uuid";
import { createMirrorJob } from "@/lib/helpers";
import type { Organization } from "@/lib/db/schema";
import { createGitHubClient, getGithubOrganizations } from "@/lib/github";
import { repoStatusEnum } from "@/types/Repository";

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const userConfig = await db
      .select()
      .from(configs)
      .where(eq(configs.userId, userId))
      .limit(1);

    if (userConfig.length === 0) {
      return new Response(
        JSON.stringify({ error: "No configuration found for this user" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const config = userConfig[0];

    if (!config.githubConfig || !config.githubConfig.token) {
      return new Response(
        JSON.stringify({ error: "GitHub token is missing in config" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const octokit = createGitHubClient(config.githubConfig.token);

    // Fetch GitHub organizations
    const gitOrgs = await getGithubOrganizations({ config, octokit });

    const existingOrgs = await db
      .select()
      .from(organizations)
      .where(eq(organizations.userId, userId));

    // Sync to DB (Insert or Update)
    for (const org of gitOrgs) {
      const existing = existingOrgs.find((o) => o.name === org.name);

      if (!existing) {
        const orgId = uuidv4();

        await db.insert(organizations).values({
          id: orgId,
          userId,
          configId: config.id,

          avatarUrl: org.avatarUrl,

          name: org.name,

          membershipRole: org.membershipRole,

          isIncluded: false,
          status: org.status,
          repositoryCount: org.repositoryCount,

          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await createMirrorJob({
          userId,
          organizationName: org.name,
          status: "imported",
          message: `Organization ${org.name} fetched successfully`,
          details: `Organization ${org.name} was fetched from GitHub`,
        });
      } else {
        await db
          .update(organizations)
          .set({ ...org, updatedAt: new Date() })
          .where(eq(organizations.id, existing.id));
      }
    }

    const latestOrgs = await db
      .select()
      .from(organizations)
      .where(eq(organizations.userId, userId));

    const orgsWithIds: Organization[] = latestOrgs.map((org) => ({
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

    return new Response(JSON.stringify(resPayload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching configs:", error);

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
