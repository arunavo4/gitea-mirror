import type { APIRoute } from "astro";
import { redisSubscriber } from "@/lib/redis";

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return new Response("Missing userId", { status: 400 });
  }

  const channel = `mirror-status:${userId}`;
  let isClosed = false;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const handleMessage = (ch: string, message: string) => {
        if (isClosed || ch !== channel) return;
        try {
          controller.enqueue(encoder.encode(`data: ${message}\n\n`));
        } catch (err) {
          console.error("Stream enqueue error:", err);
        }
      };

      redisSubscriber.subscribe(channel, (err) => {
        if (err) {
          isClosed = true;
          controller.error(err);
        }
      });

      redisSubscriber.on("message", handleMessage);

      try {
        controller.enqueue(encoder.encode(": connected\n\n"));
      } catch (err) {
        console.error("Initial enqueue error:", err);
      }

      request.signal?.addEventListener("abort", () => {
        if (!isClosed) {
          isClosed = true;
          redisSubscriber.off("message", handleMessage);
          redisSubscriber.unsubscribe(channel);
          controller.close();
        }
      });
    },
    cancel() {
      // extra safety in case cancel is triggered
      if (!isClosed) {
        isClosed = true;
        redisSubscriber.unsubscribe(channel);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};
