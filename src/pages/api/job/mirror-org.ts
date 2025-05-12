import type { APIRoute } from "astro";
import type { MirrorOrgRequest, MirrorOrgResponse } from "@/types/mirror";
import { db, configs, organizations } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";
import { createGitHubClient } from "@/lib/github";
import { mirrorGitHubOrgToGitea } from "@/lib/gitea";
import { repoStatusEnum } from "@/types/Repository";
import { type MembershipRole } from "@/types/organizations";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: MirrorOrgRequest = await request.json();
    const { userId, organizationIds } = body;

    if (!userId || !organizationIds || !Array.isArray(organizationIds)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "userId and organizationIds are required.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (organizationIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No organization IDs provided.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch config
    const configResult = await db
      .select()
      .from(configs)
      .where(eq(configs.userId, userId))
      .limit(1);

    const config = configResult[0];

    if (!config || !config.githubConfig.token) {
      return new Response(
        JSON.stringify({ error: "Config missing for the user or token." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch organizations
    const orgs = await db
      .select()
      .from(organizations)
      .where(inArray(organizations.id, organizationIds));

    if (!orgs.length) {
      return new Response(
        JSON.stringify({ error: "No organizations found for the given IDs." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fire async mirroring without blocking response
    setTimeout(async () => {
      for (const org of orgs) {
        if (!config.githubConfig.token) {
          throw new Error("GitHub token is missing in config.");
        }

        const octokit = createGitHubClient(config.githubConfig.token);

        try {
          await mirrorGitHubOrgToGitea({
            config,
            octokit,
            organization: {
              ...org,
              status: repoStatusEnum.parse("imported"),
              membershipRole: org.membershipRole as MembershipRole,
              lastMirrored: org.lastMirrored ?? undefined,
              errorMessage: org.errorMessage ?? undefined,
            },
          });
        } catch (error) {
          console.error(`Mirror failed for organization ${org.name}:`, error);
        }
      }
    }, 0);

    const responsePayload: MirrorOrgResponse = {
      success: true,
      message: "Mirror job started.",
      organizations: orgs.map((org) => ({
        ...org,
        status: repoStatusEnum.parse(org.status),
        membershipRole: org.membershipRole as MembershipRole,
        lastMirrored: org.lastMirrored ?? undefined,
        errorMessage: org.errorMessage ?? undefined,
      })),
    };

    // Immediate response
    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in mirroring organization:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "An unknown error occurred.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
