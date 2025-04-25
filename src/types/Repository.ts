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

export interface Filter {
  searchTerm: string;
  status: RepoStatus;
  name: string;
  organization: string;
  owner: string;
  lastMirrored: string;
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
