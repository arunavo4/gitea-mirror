import type { Repository } from "@/lib/db/schema";
import { z } from "zod";

export const repoStatusEnum = z.enum([
  "imported",
  "mirroring",
  "mirrored",
  "failed",
  "syncing",
  "synced",
  "",
]);

export type RepoStatus = z.infer<typeof repoStatusEnum>;

export interface RepoFilter {
  searchTerm: string;
  status: RepoStatus;
}

export interface RepositoryApiResponse {
  repositories: Repository[];
}

export interface GitRepo {
  name: string;
  fullName: string;
  url: string;
  isPrivate: boolean;
  isFork: boolean;
  owner: string;
  organization?: string;
  hasIssues: boolean;
  isStarred: boolean;
}
