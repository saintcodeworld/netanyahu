import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  // GET — fetch current prize pool balance
  if (req.method === "GET") {
    try {
      const { data, error } = await supabase
        .from("prize_pool")
        .select("balance")
        .eq("id", "global")
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ balance: Number(data.balance) }), {
        status: 200,
        headers,
      });
    } catch (error) {
      console.error("Error fetching prize pool:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch prize pool" }), {
        status: 500,
        headers,
      });
    }
  }

  // POST — add to pool or claim reward
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { action, amount } = body;

      if (action === "add" && typeof amount === "number" && amount > 0) {
        const { data, error } = await supabase.rpc("add_to_pool", {
          amount,
        });
        if (error) throw error;
        return new Response(JSON.stringify({ balance: Number(data) }), {
          status: 200,
          headers,
        });
      }

      if (action === "claim") {
        const { data, error } = await supabase.rpc("claim_reward");
        if (error) throw error;
        return new Response(
          JSON.stringify({ reward: Number(data), balance: 5.0 }),
          { status: 200, headers }
        );
      }

      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers,
      });
    } catch (error) {
      console.error("Prize pool error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers,
      });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers,
  });
}
