import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const BOMB_EVENTS_KEY = "bomb_events";

export const config = { runtime: "edge" };

interface BombEvent {
  country: string;
  centroid: [number, number] | null;
  wallet: string | null;
  timestamp: number;
}

export default async function handler(req: Request) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store",
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
    const rawEvents: string[] = (await redis.lrange(BOMB_EVENTS_KEY, 0, 99)) || [];

    const events: BombEvent[] = rawEvents
      .map((raw) => {
        try {
          return typeof raw === "string" ? JSON.parse(raw) : raw;
        } catch {
          return null;
        }
      })
      .filter((e): e is BombEvent => e !== null);

    // Build leaderboard: count bombs per wallet
    const walletStats: Record<string, { bombs: number; countries: string[] }> = {};
    for (const event of events) {
      const wallet = event.wallet || "anonymous";
      if (!walletStats[wallet]) {
        walletStats[wallet] = { bombs: 0, countries: [] };
      }
      walletStats[wallet].bombs++;
      walletStats[wallet].countries.push(event.country);
    }

    const leaderboard = Object.entries(walletStats)
      .map(([wallet, stats]) => ({
        wallet,
        bombs: stats.bombs,
        countries: stats.countries,
      }))
      .sort((a, b) => b.bombs - a.bombs)
      .slice(0, 10);

    // Activity feed: most recent 20 events
    const activity = events
      .slice(0, 20)
      .map((e) => ({
        country: e.country,
        wallet: e.wallet || "anonymous",
        timestamp: e.timestamp,
      }));

    return new Response(
      JSON.stringify({ leaderboard, activity }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Leaderboard error:", error);
    return new Response(
      JSON.stringify({ leaderboard: [], activity: [] }),
      { status: 500, headers }
    );
  }
}
