import type { Organization } from "@/lib/db/schema";
import { z } from "zod";

export const orgRelationTypeEnum = z.enum(["member", "owner"]);

export type OrgRelationType = z.infer<typeof orgRelationTypeEnum>;

export interface OrganizationsApiResponse {
  success: boolean;
  message: string;
  organizations: Organization[];
}

export interface GitOrg {
  name: string;
  avatarUrl: string;
  description: string | null;
  totalRepos: number;
  userViewType: string; // "member" | "public"
}

export interface OrgFilter {
  searchTerm: string;
  type: OrgRelationType | null | "";
}
