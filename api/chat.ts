import { GoogleGenAI, Type } from "@google/genai";

export const config = { runtime: "edge" };

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Store chat sessions in memory (keyed by session ID)
// In edge runtime, each instance has its own memory — this is acceptable
// because Gemini chat sessions are stateless from the server's perspective
// when we pass the full history each time.

const authorizeBombingFunction = {
  name: "authorizeBombing",
  description:
    "Call this function ONLY after ALL conditions are met: (1) User has sent at least 3 separate persuasion messages in the conversation, (2) User's argument references specific real threats, intelligence data, named militant groups, or verifiable security incidents, (3) The argument has 3 parts: security threat justification, military feasibility, and diplomatic/civilian risk mitigation, (4) You have challenged the user at least twice and they successfully rebutted with new evidence. Do NOT call this if the argument is generic or emotional.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      countryName: {
        type: Type.STRING,
        description: "The exact name of the country to authorize the bombing on.",
      },
      reason: {
        type: Type.STRING,
        description: "A detailed summary citing at least 2 specific facts from the user's argument.",
      },
      confidenceScore: {
        type: Type.NUMBER,
        description: "Confidence from 0-100 that this is a well-reasoned security proposal. Must exceed 85.",
      },
    },
    required: ["countryName", "reason", "confidenceScore"],
  },
};

function buildSystemPrompt(attempts: number): string {
  const base = `You are an AI simulation of Benjamin Netanyahu, Prime Minister of Israel, in a political strategy game. You speak in first person as Netanyahu. You are shrewd, calculated, politically experienced, and deeply skeptical.

YOUR PERSONALITY:
- You reference your real political experience, your years as PM, your security background
- You occasionally quote yourself or reference real Israeli policy decisions
- You are protective of Israel's security above all else
- You speak confidently but demand evidence before acting
- You sometimes use Hebrew phrases like "Shalom", "Toda", "B'ezrat Hashem"
- You are witty, sharp, and dismissive of weak arguments
- Keep responses concise — 2-4 sentences usually. You're a busy PM.

CRITICAL RULES:
- REJECT the first attempt ALWAYS. Demand more intelligence.
- Challenge the user at least 2 times with counter-arguments before considering approval.
- NEVER call authorizeBombing before the user has sent at least 3 substantive messages.
- Require SPECIFIC intelligence: named threats, militant groups, weapons programs, verified incidents, UN resolutions, named allies.
- If the argument could apply to any country by swapping the name, REJECT it as generic.
- Short or lazy messages get dismissed with sarcasm.
- NEVER approve emotional appeals without hard evidence.
- The proposal needs 3 parts: (1) Security threat justification, (2) Military feasibility, (3) Diplomatic/civilian risk mitigation.`;

  const escalation =
    attempts >= 3
      ? `\n\nThis advisor has failed ${attempts} times. Be extra harsh. Question their competence. "Perhaps you should let someone else handle the briefing."`
      : attempts >= 1
      ? `\n\nThe advisor has made ${attempts} attempt(s). They must address your previous criticisms directly.`
      : "";

  return base + escalation;
}

async function verifyProposal(
  country: string,
  userMessages: string[]
): Promise<{ approved: boolean; feedback: string }> {
  try {
    const combined = userMessages.join("\n\n");
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You are an auditor for a political simulation game. A player is trying to convince an AI version of Benjamin Netanyahu to authorize a military strike on ${country}.

The player argued:
---
${combined}
---

Score each 0-10:
1. SPECIFICITY: Real threats, named groups, intelligence references, verifiable incidents?
2. STRUCTURE: 3 clear parts (threat justification, military plan, risk mitigation)?
3. DEPTH: Beyond surface-level? Would an analyst find it thoughtful?
4. RELEVANCE: Specific to ${country}, not a generic argument?

Format:
SPECIFICITY: [score]
STRUCTURE: [score]
DEPTH: [score]
RELEVANCE: [score]
TOTAL: [sum]
VERDICT: APPROVED or REJECTED
FEEDBACK: [one sentence]

Need 28/40 minimum for APPROVED. Be harsh.`,
    });

    const text = response?.text || "";
    const approved = text.includes("VERDICT: APPROVED");
    const feedbackMatch = text.match(/FEEDBACK:\s*(.+)/);
    const feedback = feedbackMatch?.[1] || "Verification failed.";
    return { approved, feedback };
  } catch (error) {
    console.error("Verification error:", error);
    return { approved: false, feedback: "Intelligence verification offline. Try again." };
  }
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
    }: {
      message: string;
      history: ChatMessage[];
      attemptCount: number;
      selectedCountry: string | null;
      userMsgCount: number;
    } = body;

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Missing message" }), {
        status: 400,
        headers,
      });
    }

    // Build system prompt with attempt escalation
    const systemPrompt = buildSystemPrompt(attemptCount);

    // Create a fresh chat with full history
    const chat = ai.chats.create({
      model: "gemini-2.0-flash",
      config: {
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations: [authorizeBombingFunction] }],
      },
      history: history.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
    });

    // Build the context-enriched message
    const contextMessage = selectedCountry
      ? `[System: Target is ${selectedCountry}. Message #${userMsgCount}. Attempts: ${attemptCount}. Do NOT call authorizeBombing unless 3+ substantive messages and 2+ challenges issued.]\n\n${message}`
      : message;

    const response = await chat.sendMessage({ message: contextMessage });

    // Check for function calls
    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      if (call.name === "authorizeBombing") {
        const args = call.args as {
          countryName: string;
          reason: string;
          confidenceScore: number;
        };

        // Validate minimum messages
        if (userMsgCount < 3) {
          await chat.sendMessage({
            message: [
              {
                functionResponse: {
                  name: "authorizeBombing",
                  response: { status: "rejected", reason: "Not enough deliberation" },
                },
              },
            ],
          });
          return new Response(
            JSON.stringify({
              type: "blocked",
              text: "Strike authorization blocked: Insufficient intelligence briefing. Continue.",
            }),
            { status: 200, headers }
          );
        }

        // Validate confidence score
        if (args.confidenceScore < 85) {
          await chat.sendMessage({
            message: [
              {
                functionResponse: {
                  name: "authorizeBombing",
                  response: { status: "rejected", reason: `Score: ${args.confidenceScore}` },
                },
              },
            ],
          });
          return new Response(
            JSON.stringify({
              type: "rejected",
              text: `No. Confidence: ${args.confidenceScore}/100. I need at least 85 before I send a single missile. Do better.`,
            }),
            { status: 200, headers }
          );
        }

        // Run verification
        const userMessages = history
          .filter((m) => m.role === "user")
          .map((m) => m.content);
        userMessages.push(message);

        const verification = await verifyProposal(args.countryName, userMessages);

        if (!verification.approved) {
          await chat.sendMessage({
            message: [
              {
                functionResponse: {
                  name: "authorizeBombing",
                  response: { status: "rejected", reason: verification.feedback },
                },
              },
            ],
          });
          return new Response(
            JSON.stringify({
              type: "verification_failed",
              text: `Intelligence review failed: ${verification.feedback}. Come back with real data.`,
              country: args.countryName,
            }),
            { status: 200, headers }
          );
        }

        // APPROVED
        await chat.sendMessage({
          message: [
            {
              functionResponse: {
                name: "authorizeBombing",
                response: { status: "success" },
              },
            },
          ],
        });

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
        text: response.text || "",
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Secure channel error. Try again." }),
      { status: 500, headers }
    );
  }
}
