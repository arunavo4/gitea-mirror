import type { MirrorJob } from "@/lib/db/schema";
import { z } from "zod";
import type { RepoStatus } from "./Repository";

export const activityLogLevelEnum = z.enum(["info", "warning", "error", ""]);

export interface ActivityFilter {
  searchTerm: string;
  status: RepoStatus;
}

export interface ActivityApiResponse {
  success: boolean;
  message: string;
  activities: MirrorJob[];
}
