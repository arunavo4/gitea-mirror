import { useEffect, useState, useCallback } from "react";
import type { MirrorJob } from "@/lib/db/schema";

interface UseSSEOptions {
  userId?: string;
  onMessage: (message: MirrorJob) => void;
}

export const useSSE = ({ userId, onMessage }: UseSSEOptions) => {
  const [connected, setConnected] = useState<boolean>(false);

  // Memoize the message handler to prevent effect re-runs
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const parsedMessage: MirrorJob = JSON.parse(event.data);
        onMessage(parsedMessage);
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    },
    [onMessage]
  );

  useEffect(() => {
    if (!userId) return;

    const createEventSource = () => {
      const eventSource = new EventSource(`/api/sse?userId=${userId}`);

      eventSource.onopen = () => {
        setConnected(true);
        console.log(`Connected to SSE for user: ${userId}`);
      };

      eventSource.onmessage = handleMessage; // Use the memoized handler

      eventSource.onerror = () => {
        console.error("SSE connection error");
        setConnected(false);
        eventSource.close();
        // Retry connection after 5 seconds if there's an error
        setTimeout(createEventSource, 5000);
      };

      return eventSource;
    };

    const eventSource = createEventSource();

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, [userId, handleMessage]); // Now depends on the memoized handler

  return { connected };
};
