import type { APIRoute } from "astro";
import { Octokit } from "@octokit/rest";
import { configs, db, organizations, repositories } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { jsonResponse } from "@/lib/utils";
import type {
  AddOrganizationApiRequest,
  AddOrganizationApiResponse,
} from "@/types/organizations";
import type { RepositoryVisibility, RepoStatus } from "@/types/Repository";
import { v4 as uuidv4 } from "uuid";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: AddOrganizationApiRequest = await request.json();
    const { role, org, userId } = body;

    if (!org || !userId || !role) {
      return jsonResponse({
        data: { success: false, error: "Missing org, role or userId" },
        status: 400,
      });
    }

    // Check if org already exists
    const existingOrg = await db
      .select()
      .from(organizations)
      .where(
        and(eq(organizations.name, org), eq(organizations.userId, userId))
      );

    if (existingOrg.length > 0) {
      return jsonResponse({
        data: {
          success: false,
          error: "Organization already exists for this user",
        },
        status: 400,
      });
    }

    // Get user's config
    const [config] = await db
      .select()
      .from(configs)
      .where(eq(configs.userId, userId))
      .limit(1);

    if (!config) {
      return jsonResponse({
        data: { error: "No configuration found for this user" },
        status: 404,
      });
    }

    const configId = config.id;

    const octokit = new Octokit();

    // Fetch org metadata
    const { data: orgData } = await octokit.orgs.get({ org });

    // Fetch public repos using Octokit paginator
    const publicRepos = await octokit.paginate(octokit.repos.listForOrg, {
      org,
      type: "public",
      per_page: 100,
    });

    // Insert repositories
    const repoRecords = publicRepos.map((repo) => ({
      id: uuidv4(),
      userId,
      configId,
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      cloneUrl: repo.clone_url ?? "",
      owner: repo.owner.login,
      organization:
        repo.owner.type === "Organization" ? repo.owner.login : null,
      isPrivate: repo.private,
      isForked: repo.fork,
      forkedFrom: undefined,
      hasIssues: repo.has_issues,
      isStarred: false,
      isArchived: repo.archived,
      size: repo.size,
      hasLFS: false,
      hasSubmodules: false,
      defaultBranch: repo.default_branch ?? "main",
      visibility: (repo.visibility ?? "public") as RepositoryVisibility,
      status: "imported" as RepoStatus,
      lastMirrored: undefined,
      errorMessage: undefined,
      createdAt: repo.created_at ? new Date(repo.created_at) : new Date(),
      updatedAt: repo.updated_at ? new Date(repo.updated_at) : new Date(),
    }));

    await db.insert(repositories).values(repoRecords);

    // Insert organization metadata
    const organizationRecord = {
      id: uuidv4(),
      userId,
      configId,
      name: orgData.login,
      avatarUrl: orgData.avatar_url,
      membershipRole: role,
      isIncluded: false,
      status: "imported" as RepoStatus,
      repositoryCount: publicRepos.length,
      createdAt: orgData.created_at ? new Date(orgData.created_at) : new Date(),
      updatedAt: orgData.updated_at ? new Date(orgData.updated_at) : new Date(),
    };

    await db.insert(organizations).values(organizationRecord);

    const resPayload: AddOrganizationApiResponse = {
      success: true,
      organization: organizationRecord,
      message: "Organization and repositories imported successfully",
    };

    return jsonResponse({ data: resPayload, status: 200 });
  } catch (error) {
    console.error("Error inserting organization/repositories:", error);
    return jsonResponse({
      data: {
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      status: 500,
    });
  }
};
