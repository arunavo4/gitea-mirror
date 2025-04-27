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

export const repositoryVisibilityEnum = z.enum([
  "public",
  "private",
  "internal",
]);

export type RepositoryVisibility = z.infer<typeof repositoryVisibilityEnum>;

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
  cloneUrl: string;

  owner: string;
  organization?: string;

  isPrivate: boolean;
  isForked: boolean;
  forkedFrom?: string;

  hasIssues: boolean;
  isStarred: boolean;
  isArchived: boolean;

  size: number;
  hasLFS: boolean;
  hasSubmodules: boolean;

  defaultBranch: string;
  visibility: RepositoryVisibility;

  status: RepoStatus;
  lastMirrored?: Date;
  errorMessage?: string;

  createdAt: Date;
  updatedAt: Date;
}
