import type { APIRoute } from "astro";
import { redisPublisher } from "@/lib/redis";

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();

  const { userId, message } = body;

  if (!userId || !message) {
    return new Response("Missing userId or message", { status: 400 });
  }

  const channel = `mirror-status:${userId}`;

  try {
    await redisPublisher.publish(channel, JSON.stringify({ message }));
    return new Response(JSON.stringify({ status: "published" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Redis publish error:", err);
    return new Response("Failed to publish", { status: 500 });
  }
};
