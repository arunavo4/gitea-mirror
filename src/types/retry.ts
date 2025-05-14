import type { Repository } from "@/lib/db/schema";

export interface RetryRepoRequest {
  userId: string;
  repositoryIds: string[];
}

export interface RetryRepoResponse {
  success: boolean;
  error?: string;
  message?: string;
  repositories: Repository[];
}
