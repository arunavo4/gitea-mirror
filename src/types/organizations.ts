import type { Organization } from "@/lib/db/schema";
import { z } from "zod";
import type { RepoStatus } from "./Repository";

export const membershipRoleEnum = z.enum([
  "member",
  "admin",
  "billing_manager",
]);

export type MembershipRole = z.infer<typeof membershipRoleEnum>;

export interface OrganizationsApiResponse {
  success: boolean;
  message: string;
  organizations: Organization[];
}

export interface GitOrg {
  name: string;
  avatarUrl: string;
  membershipRole: MembershipRole;
  isIncluded: boolean;
  status: RepoStatus;
  repositoryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrgFilter {
  searchTerm: string;
  membershipRole: MembershipRole | "";
}
