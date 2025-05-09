import type { RepoStatus } from "@/types/Repository";
import { db, mirrorJobs } from "./db";
import { v4 as uuidv4 } from "uuid";
import { redisPublisher } from "./redis";

export async function createMirrorJob({
  userId,
  organizationId,
  organizationName,
  repositoryId,
  repositoryName,
  message,
  status,
  details,
}: {
  userId: string;
  organizationId?: string;
  organizationName?: string;
  repositoryId?: string;
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
    repositoryId,
    repositoryName,
    organizationId,
    organizationName,
    configId: uuidv4(),
    details,
    message: message,
    status: status,
    timestamp: currentTimestamp,
  };

  try {
    await db.insert(mirrorJobs).values(job);

    const channel = `mirror-status:${userId}`;
    await redisPublisher.publish(channel, JSON.stringify(job));

    return jobId;
  } catch (error) {
    console.error("Error creating mirror job:", error);
    throw new Error("Error creating mirror job");
  }
}
