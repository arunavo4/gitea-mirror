import type { Repository } from "@/lib/db/schema";

export interface MirrorRepoRequest {
  userId: string;
  repositoryIds: string[];
}

export interface MirrorRepoResponse {
  success: boolean;
  message?: string;
  error?: string;
  repositories: Repository[];
}

export interface MirrorOrgRequest {
  userId: string;
  organizationIds: string[];
}
