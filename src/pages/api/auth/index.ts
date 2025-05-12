import type { APIRoute } from "astro";
import { db, users, configs, client } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const GET: APIRoute = async ({ request, cookies }) => {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.split(" ")[1] || cookies.get("token")?.value;

  if (!token) {
    const userCountResult = await client.execute(
      `SELECT COUNT(*) as count FROM users`
    );
    const userCount = userCountResult.rows[0].count;

    if (userCount === 0) {
      return new Response(JSON.stringify({ error: "No users found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.id))
      .limit(1);

    if (!userResult.length) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { password, ...userWithoutPassword } = userResult[0];

    const configResult = await db
      .select({
        scheduleConfig: configs.scheduleConfig,
      })
      .from(configs)
      .where(and(eq(configs.userId, decoded.id), eq(configs.isActive, true)))
      .limit(1);

    const scheduleConfig = configResult[0]?.scheduleConfig;

    const syncEnabled = scheduleConfig?.enabled ?? false;
    const syncInterval = scheduleConfig?.interval ?? 3600;
    const lastSync = scheduleConfig?.lastRun ?? null;
    const nextSync = scheduleConfig?.nextRun ?? null;

    return new Response(
      JSON.stringify({
        ...userWithoutPassword,
        syncEnabled,
        syncInterval,
        lastSync,
        nextSync,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
};
