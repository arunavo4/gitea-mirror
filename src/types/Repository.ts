import type { Repository } from "@/lib/db/schema";

export interface Filter {
  searchTerm: string;
  status: "pending" | "mirrored" | "failed" | "imported" | "";
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
