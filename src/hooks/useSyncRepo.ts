import { useEffect, useRef } from "react";
import { useAuth } from "./useAuth";

interface UseRepoSyncOptions {
  userId?: string;
  enabled?: boolean;
  interval?: number;
  lastSync?: Date | null;
  nextSync?: Date | null | string | number;
}

export function useRepoSync({
  userId,
  enabled = true,
  interval = 3600,
  lastSync,
  nextSync,
}: UseRepoSyncOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { refreshUser } = useAuth();

  useEffect(() => {
    if (!enabled || !userId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Helper to convert possible nextSync types to Date
    const getNextSyncDate = () => {
      if (!nextSync) return null;
      if (nextSync instanceof Date) return nextSync;
      return new Date(nextSync); // Handles strings and numbers
    };

    const isTimeToSync = () => {
      const nextSyncDate = getNextSyncDate();
      if (!nextSyncDate) return true; // No nextSync means sync immediately

      const currentTime = new Date();

      return currentTime >= nextSyncDate;
    };

    const sync = async () => {
      try {
        console.log("Attempting to sync...");
        const response = await fetch("/api/job/schedule-sync-repo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          console.error("Sync failed:", await response.text());
          return;
        }

        await refreshUser(); // refreshing user data to get lastest sync times. this could be dont using the schedule-sync-repo endpoint but wont be reliable in case of failure. maybe we need t think of some other better way to do this

        const result = await response.json();
        console.log("Sync successful:", result);
        return result;
      } catch (error) {
        console.error("Sync failed:", error);
      }
    };

    if (isTimeToSync()) {
      sync();
    }

    intervalRef.current = setInterval(() => {
      if (isTimeToSync()) {
        sync();
      }
    }, interval * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    enabled,
    interval,
    userId,
    nextSync instanceof Date ? nextSync.getTime() : nextSync,
  ]);
}
