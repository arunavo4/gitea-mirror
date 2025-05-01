import type { RepoStatus } from "@/types/Repository";
import { db, mirrorJobs } from "./db";
import { v4 as uuidv4 } from "uuid";

export async function createMirrorJob({
  userId,
  organizationName,
  repositoryName,
  message,
  status,
  details,
}: {
  userId: string;
  organizationName?: string;
  repositoryName?: string;
  details?: string;
  message: string;
  status: RepoStatus;
}) {
  const jobId = uuidv4();
  const currentTimestamp = new Date();

  const job = {
    id: jobId,
    userId,
    repositoryName,
    organizationName,
    configId: uuidv4(),
    details,
    message: message,
    status: status,
    timestamp: currentTimestamp,
  };

  try {
    await db.insert(mirrorJobs).values(job);
    return jobId;
  } catch (error) {
    console.error("Error creating mirror job:", error);
    throw new Error("Error creating mirror job");
  }
}
