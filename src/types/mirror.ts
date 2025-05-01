import type { Organization, Repository } from "@/lib/db/schema";

export interface MirrorRepoRequest {
  userId: string;
  repositoryIds: string[];
}

export interface MirrorRepoResponse {
  success: boolean;
  error?: string;
  message?: string;
  repositories: Repository[];
}

export interface MirrorOrgRequest {
  userId: string;
  organizationIds: string[];
}

export interface MirrorOrgRequest {
  userId: string;
  organizationIds: string[];
}

export interface MirrorOrgResponse {
  success: boolean;
  error?: string;
  message?: string;
  organizations: Organization[];
}
