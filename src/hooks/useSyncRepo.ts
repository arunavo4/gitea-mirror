import { useEffect, useRef } from "react";

interface UseRepoSyncOptions {
  userId?: string;
  enabled?: boolean;
  interval?: number;
  lastSync?: Date | null;
  nextSync?: Date | null;
}

export function useRepoSync({
  userId,
  enabled = true,
  interval = 3600,
  lastSync,
  nextSync,
}: UseRepoSyncOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !userId) return;

    // Function to check whether it's time to sync
    const isTimeToSync = () => {
      if (!nextSync) return true; // If there's no nextSync, trigger immediately

      const currentTime = new Date();
      return currentTime >= nextSync; // If the current time is past the nextSync time, it's time to sync
    };

    const sync = async () => {
      try {
        const response = await fetch("/api/job/schedule-sync-repo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          console.error("Sync failed:", await response.text());
        }

        console.log("Sync successful:", await response.json());
      } catch (error) {
        console.error("Sync failed:", error);
      }
    };

    if (isTimeToSync()) {
      sync(); // Trigger the sync immediately if it's time
    }

    intervalRef.current = setInterval(() => {
      if (isTimeToSync()) {
        sync(); // Sync at the scheduled interval if it's time
      }
    }, interval * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, interval, userId, nextSync]); // Add nextSync as a dependency
}
