import type { MirrorJob } from "@/lib/db/schema";
import { z } from "zod";

export const activityLogLevelEnum = z.enum(["info", "warning", "error", ""]);

export interface ActivityApiResponse {
  success: boolean;
  message: string;
  activities: MirrorJob[];
}
