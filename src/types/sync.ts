import type { Organization, Repository } from "@/lib/db/schema";

export interface SyncRepoRequest {
  userId: string;
  repositoryIds: string[];
}

export interface SyncRepoResponse {
  success: boolean;
  error?: string;
  message?: string;
  repositories: Repository[];
}
