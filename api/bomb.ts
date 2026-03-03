import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const BOMBED_KEY = "bombed_countries";
const BOMB_EVENTS_KEY = "bomb_events";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers,
    });
  }

  try {
    const body = await req.json();
    const { country, centroid, wallet } = body;

    if (!country || typeof country !== "string") {
      return new Response(JSON.stringify({ error: "Missing country" }), {
        status: 400,
        headers,
      });
    }

    // Check if already bombed
    const alreadyBombed = await redis.sismember(BOMBED_KEY, country);
    if (alreadyBombed) {
      return new Response(
        JSON.stringify({ error: "Country already bombed", country }),
        { status: 409, headers }
      );
    }

    // Add to bombed set
    await redis.sadd(BOMBED_KEY, country);

    // Push bomb event for real-time listeners (stored in a list, trimmed to last 100)
    const event = JSON.stringify({
      country,
      centroid: centroid || null,
      wallet: wallet || null,
      timestamp: Date.now(),
    });
    await redis.lpush(BOMB_EVENTS_KEY, event);
    await redis.ltrim(BOMB_EVENTS_KEY, 0, 99);

    return new Response(
      JSON.stringify({ success: true, country }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Error bombing country:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers,
    });
  }
}
