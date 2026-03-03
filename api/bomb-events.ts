import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const BOMB_EVENTS_KEY = "bomb_events";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Last-Event-ID",
      },
    });
  }

  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Get the timestamp from which client wants events (passed as query param)
  const url = new URL(req.url);
  const since = parseInt(url.searchParams.get("since") || "0", 10);

  try {
    // Fetch recent bomb events from Redis list
    const rawEvents: string[] = (await redis.lrange(BOMB_EVENTS_KEY, 0, 49)) || [];

    // Parse and filter events newer than `since`
    const events = rawEvents
      .map((raw) => {
        try {
          return typeof raw === "string" ? JSON.parse(raw) : raw;
        } catch {
          return null;
        }
      })
      .filter((e): e is { country: string; centroid: [number, number] | null; timestamp: number } =>
        e !== null && e.timestamp > since
      )
      .reverse(); // oldest first so client processes in order

    return new Response(JSON.stringify({ events }), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store",
      },
    });
  } catch (error) {
    console.error("Error fetching bomb events:", error);
    return new Response(JSON.stringify({ events: [] }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }
}
