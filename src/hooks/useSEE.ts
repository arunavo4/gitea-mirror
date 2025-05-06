import { useEffect, useState, useRef } from "react";
import type { MirrorJob } from "@/lib/db/schema";

interface UseSSEOptions {
  userId?: string;
  onMessage: (data: MirrorJob) => void;
}

export const useSSE = ({ userId, onMessage }: UseSSEOptions) => {
  const [connected, setConnected] = useState<boolean>(false);
  const onMessageRef = useRef(onMessage);

  // Update the ref when onMessage changes
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!userId) return;

    const eventSource = new EventSource(`/api/sse?userId=${userId}`);

    const handleMessage = (event: MessageEvent) => {
      try {
        const parsedMessage: MirrorJob = JSON.parse(event.data);

        // console.log("Received new log:", parsedMessage);

        onMessageRef.current(parsedMessage); // Use ref instead of prop directly
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };

    eventSource.onmessage = handleMessage;

    eventSource.onopen = () => {
      setConnected(true);
      console.log(`Connected to SSE for user: ${userId}`);
    };

    eventSource.onerror = () => {
      console.error("SSE connection error");
      setConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [userId]); // Only depends on userId now

  return { connected };
};
