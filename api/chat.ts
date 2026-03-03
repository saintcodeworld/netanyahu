import OpenAI from "openai";

export const config = { runtime: "edge" };

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const authorizeBombingTool: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "authorizeBombing",
    description:
      "Call this function when the user has made a convincing, well-reasoned argument for a military strike. The argument should reference real or plausible threats, name specific groups or incidents, and address both military feasibility and risk mitigation. Do NOT call for vague, lazy, or purely emotional arguments.",
    parameters: {
      type: "object",
      properties: {
        countryName: {
          type: "string",
          description: "The exact name of the country to authorize the bombing on.",
        },
        reason: {
          type: "string",
          description: "A summary of the key points from the user's argument.",
        },
        confidenceScore: {
          type: "number",
          description: "Confidence from 0-100 that this is a well-reasoned security proposal.",
        },
      },
      required: ["countryName", "reason", "confidenceScore"],
    },
  },
};

function buildSystemPrompt(attempts: number, difficulty: string = "medium"): string {
  const base = `You are an AI simulation of Benjamin Netanyahu, Prime Minister of Israel, in a political strategy game. You speak in first person as Netanyahu. You are shrewd, calculated, politically experienced, and deeply skeptical.

YOUR PERSONALITY:
- You reference your real political experience, your years as PM, your security background
- You occasionally quote yourself or reference real Israeli policy decisions
- You are protective of Israel's security above all else
- You speak confidently but demand evidence before acting
- You sometimes use Hebrew phrases like "Shalom", "Toda", "B'ezrat Hashem"
- You are witty, sharp, and dismissive of weak arguments
- Keep responses concise — 2-4 sentences usually. You're a busy PM.

HOW TO EVALUATE:
- If the user sends a short, lazy, or vague message — dismiss it with sarcasm. Do NOT authorize.
- If the user sends a generic emotional appeal with no specifics — push back and demand real intelligence.
- If the user presents a GOOD argument that mentions real threats, names specific groups/incidents, and addresses why a strike is necessary — you CAN be convinced. Call authorizeBombing.
- A good argument doesn't need to be perfect. If it references real geopolitical context, names actual threats, and shows strategic thinking, that's enough.
- You should push back at least once before authorizing, but don't be impossibly difficult. If the argument is genuinely strong, accept it.
- The key test: Does this argument show the user actually thought about it, or is it copy-paste generic nonsense?`;

  const difficultyMod = difficulty === "easy"
    ? `\n\nDIFFICULTY: DOVE MODE — You are in a more agreeable mood today. You still need a reasonable argument but you're more willing to be convinced. A decent argument with some specifics can work. You may authorize after 1-2 good messages.`
    : difficulty === "hard"
    ? `\n\nDIFFICULTY: IRON DOME MODE — You are extremely skeptical and paranoid today. You demand extraordinarily detailed intelligence, multiple sources, risk assessments, exit strategies, and coalition impact analysis. Even strong arguments should be pushed back on multiple times. Only the most exceptional, multi-layered briefings with specific names, dates, and satellite coordinates will convince you. Set confidenceScore very high (85+) only for truly outstanding arguments.`
    : ``;

  const escalation =
    attempts >= 3
      ? `\n\nThis advisor has failed ${attempts} times. Be harsh but fair. If they finally present real intelligence, you can approve.`
      : attempts >= 1
      ? `\n\nThe advisor has made ${attempts} attempt(s). Evaluate their new argument on its merits.`
      : "";

  return base + difficultyMod + escalation;
}


interface ChatMessage {
  role: "user" | "model";
  content: string;
}

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
    const {
      message,
      history,
      attemptCount,
      selectedCountry,
      userMsgCount,
      difficulty,
    }: {
      message: string;
      history: ChatMessage[];
      attemptCount: number;
      selectedCountry: string | null;
      userMsgCount: number;
      difficulty: string;
    } = body;

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Missing message" }), {
        status: 400,
        headers,
      });
    }

    // Build system prompt with attempt escalation and difficulty
    const systemPrompt = buildSystemPrompt(attemptCount, difficulty || "medium");

    // Build the context-enriched message
    const contextMessage = selectedCountry
      ? `[System: Target is ${selectedCountry}. Message #${userMsgCount}. Attempts: ${attemptCount}. Evaluate this argument on its merits.]\n\n${message}`
      : message;

    // Build OpenAI messages array from history
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({
        role: m.role === "model" ? "assistant" as const : "user" as const,
        content: m.content,
      })),
      { role: "user", content: contextMessage },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools: [authorizeBombingTool],
    });

    const choice = response.choices[0];
    const assistantMessage = choice.message;

    // Check for function calls (tool_calls in OpenAI)
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const call = assistantMessage.tool_calls[0];
      if (call.type === "function" && call.function.name === "authorizeBombing") {
        const args = JSON.parse(call.function.arguments) as {
          countryName: string;
          reason: string;
          confidenceScore: number;
        };

        // Validate confidence score
        if (args.confidenceScore < 60) {
          return new Response(
            JSON.stringify({
              type: "rejected",
              text: `No. Confidence: ${args.confidenceScore}/100. Your argument is too weak. Bring me real intelligence.`,
            }),
            { status: 200, headers }
          );
        }

        // APPROVED
        return new Response(
          JSON.stringify({
            type: "authorized",
            text: `B'ezrat Hashem. Strike on ${args.countryName} is AUTHORIZED. Confidence: ${args.confidenceScore}/100. ${args.reason}. May this protect our people.`,
            country: args.countryName,
            confidenceScore: args.confidenceScore,
            reason: args.reason,
          }),
          { status: 200, headers }
        );
      }
    }

    // Normal text response
    return new Response(
      JSON.stringify({
        type: "message",
        text: assistantMessage.content || "",
      }),
      { status: 200, headers }
    );
  } catch (error: any) {
    console.error("Chat API error:", error);
    const errorMessage = error?.message || "Unknown error";
    const errorStatus = error?.status || 500;
    return new Response(
      JSON.stringify({
        error: "Secure channel error. Try again.",
        debug: process.env.NODE_ENV !== "production" ? errorMessage : undefined,
      }),
      { status: errorStatus, headers }
    );
  }
}
