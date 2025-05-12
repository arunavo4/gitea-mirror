import type { Repository } from "@/lib/db/schema";

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

export interface ScheduleSyncRepoRequest {
  userId: string;
}

export interface ScheduleSyncRepoResponse {
  success: boolean;
  error?: string;
  message?: string;
  repositories: Repository[];
}
