import type { APIRoute } from "astro";
import type { MirrorOrgRequest, MirrorOrgResponse } from "@/types/mirror";
import { db, configs, organizations } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";
import { createGitHubClient } from "@/lib/github";
import { mirrorGithubOrgToGitea } from "@/lib/gitea";
import { createMirrorJob } from "@/lib/helpers";
import { repoStatusEnum } from "@/types/Repository";
import type { MembershipRole } from "@/types/organizations";

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

    const timestamp = new Date();

    // Immediately mark organizations as "mirroring"
    for (const org of orgs) {
      await db
        .update(organizations)
        .set({
          isIncluded: true,
          status: repoStatusEnum.parse("mirroring"),
          updatedAt: timestamp,
        })
        .where(eq(organizations.id, org.id));

      await createMirrorJob({
        userId,
        organizationName: org.name,
        message: `Started mirroring organization: ${org.name}`,
        details: `Organization ${org.name} is now in the mirroring state.`,
        status: repoStatusEnum.parse("mirroring"),
      });
    }

    const updatedOrgs = await db
      .select()
      .from(organizations)
      .where(inArray(organizations.id, organizationIds));

    // Fire async mirroring without blocking response
    setTimeout(async () => {
      for (const org of updatedOrgs) {
        try {
          if (!config.githubConfig.token) {
            throw new Error("GitHub token is missing in config.");
          }

          const octokit = createGitHubClient(config.githubConfig.token);

          await mirrorGithubOrgToGitea({
            config,
            octokit,
            orgName: org.name,
          });

          await db
            .update(organizations)
            .set({
              status: repoStatusEnum.parse("mirrored"),
              updatedAt: new Date(),
              lastMirrored: new Date(),
              errorMessage: null,
            })
            .where(eq(organizations.id, org.id));

          await createMirrorJob({
            userId,
            organizationName: org.name,
            message: `Successfully mirrored organization: ${org.name}`,
            details: `Organization ${org.name} has been successfully mirrored.`,
            status: repoStatusEnum.parse("mirrored"),
          });
        } catch (error) {
          console.error(`Mirror failed for organization ${org.name}:`, error);

          await db
            .update(organizations)
            .set({
              status: repoStatusEnum.parse("failed"),
              updatedAt: new Date(),
              errorMessage:
                error instanceof Error ? error.message : "Unknown error",
            })
            .where(eq(organizations.id, org.id));

          await createMirrorJob({
            userId,
            organizationName: org.name,
            message: `Failed to mirror organization: ${org.name}`,
            details: `Organization ${org.name} failed to mirror. Error: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            status: repoStatusEnum.parse("failed"),
          });
        }
      }
    }, 0);

    const responsePayload: MirrorOrgResponse = {
      success: true,
      message: "Mirror job started.",
      organizations: updatedOrgs.map((org) => ({
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
    console.error("Error in /api/job/mirror-org:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "An unknown error occurred.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
