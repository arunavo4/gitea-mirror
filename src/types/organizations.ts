import type { Organization } from "@/lib/db/schema";
import { z } from "zod";

export const orgRelationTypeEnum = z.enum(["member", "public"]);

export type OrgRelationType = z.infer<typeof orgRelationTypeEnum>;

export interface OrganizationsApiResponse {
  organizations: any[];
}

export interface OrganizationResponse {
  success: boolean;
  message: string;
  organizations: Organization[];
}
