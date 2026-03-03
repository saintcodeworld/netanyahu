import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const BOMBED_KEY = "bombed_countries";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers,
    });
  }

  try {
    const countries: string[] = (await redis.smembers(BOMBED_KEY)) || [];
    return new Response(JSON.stringify({ countries }), { status: 200, headers });
  } catch (error) {
    console.error("Error fetching bombed countries:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers,
    });
  }
}
