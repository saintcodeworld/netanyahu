import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send, Crosshair, Coins } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSolPayment } from "../hooks/useSolPayment";
import { usePrizePool } from "../context/PrizePoolContext";
import bibiImage from "/assets/DeepBB.png";

const API_BASE = "/api";

const COOLDOWN_MS = 60_000;
const countryCooldowns: Record<string, number> = {};

interface Message {
  role: "user" | "model" | "system";
  content: string;
}

interface ChatProps {
  selectedCountry: string | null;
  onConvinced: (country: string) => void;
  onRewardClaimed?: (amount: number) => void;
  bombedCountries: Set<string>;
}

// Track used prompts globally to prevent reuse across countries
const usedPrompts = new Set<string>();

const PROTECTED_ALLIES = new Set(["United States of America", "United States", "United Kingdom"]);

const ALLY_MESSAGES_US: string[] = [
  "Bomb America? Are you meshuggeneh? They give us $3.8 billion a year! I'm not biting the hand that feeds me.",
  "The United States is not a target, it's a ATM. Next question.",
  "You want me to bomb my biggest donor? I didn't survive 40 years in politics by being stupid.",
  "America? Absolutely not. Who do you think pays for the Iron Dome? Use your head.",
  "I just got off the phone with the President. We're best friends. Try again with someone I actually dislike.",
  "Bomb the US? That's the funniest thing I've heard since my last coalition meeting. The answer is no.",
  "My friend, without America, I wouldn't have half my military budget. Pick a real target.",
  "I need America more than hummus needs tahini. Not happening.",
];

const ALLY_MESSAGES_UK: string[] = [
  "The United Kingdom? No no no. They gave us the Balfour Declaration! We owe them, technically.",
  "Bomb Britain? They literally helped create Israel. Show some gratitude, habibi.",
  "The UK is off limits. I still need them to vote for us at the UN... sometimes.",
  "England? I have tea with their PM every summit. Very civilized people. Not bombing them.",
  "You want me to bomb the country that invented fish and chips? I'm not a monster.",
  "The British are our old friends. Complicated friends, yes. But you don't bomb complicated friends.",
  "Absolutely not. The UK is useful to me. I keep my useful friends very close.",
  "Bomb the UK? What's next, you want me to bomb my own Knesset? ...Actually, don't answer that.",
];

let allyMsgIndexUS = 0;
let allyMsgIndexUK = 0;

export default function ChatComponent({ selectedCountry, onConvinced, onRewardClaimed, bombedCountries }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content: "Shalom. I am Benjamin Netanyahu. You want me to authorize a military strike? I do not send missiles based on feelings. Present me with hard intelligence \u2014 name the threat, prove feasibility, and show me you've considered the consequences. Select your target on the map and convince me.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountryRef = useRef<string | null>(null);

  // When an ally country is selected, show a funny warning message
  useEffect(() => {
    if (selectedCountry && selectedCountry !== prevCountryRef.current && PROTECTED_ALLIES.has(selectedCountry)) {
      let msg: string;
      if (selectedCountry === "United Kingdom") {
        msg = ALLY_MESSAGES_UK[allyMsgIndexUK % ALLY_MESSAGES_UK.length];
        allyMsgIndexUK++;
      } else {
        msg = ALLY_MESSAGES_US[allyMsgIndexUS % ALLY_MESSAGES_US.length];
        allyMsgIndexUS++;
      }
      setMessages((prev) => [...prev, { role: "model", content: msg }]);
    }
    prevCountryRef.current = selectedCountry;
  }, [selectedCountry]);

  const { connected } = useWallet();
  const { payForMessage, messageCost, canPay } = useSolPayment();
  const { prizePool, addToPool, claimReward } = usePrizePool();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!connected) {
      setMessages((prev) => [
        ...prev,
        { role: "system", content: "Connect your Phantom wallet to send messages. Each message costs 0.01 SOL." },
      ]);
      return;
    }

    // Block if selected country is a protected ally
    if (selectedCountry && PROTECTED_ALLIES.has(selectedCountry)) {
      let msg: string;
      if (selectedCountry === "United Kingdom") {
        msg = ALLY_MESSAGES_UK[allyMsgIndexUK % ALLY_MESSAGES_UK.length];
        allyMsgIndexUK++;
      } else {
        msg = ALLY_MESSAGES_US[allyMsgIndexUS % ALLY_MESSAGES_US.length];
        allyMsgIndexUS++;
      }
      setMessages((prev) => [...prev, { role: "model", content: msg }]);
      return;
    }

    // Block if selected country is already bombed
    if (selectedCountry && bombedCountries.has(selectedCountry)) {
      setMessages((prev) => [
        ...prev,
        { role: "system", content: `${selectedCountry} has already been bombed. Select a different target.` },
      ]);
      return;
    }

    // Block duplicate prompts across countries
    const normalizedMsg = input.trim().toLowerCase().replace(/\s+/g, " ");
    if (usedPrompts.has(normalizedMsg)) {
      setMessages((prev) => [
        ...prev,
        { role: "system", content: "This argument has already been used. You cannot reuse the same prompt on another country. Write a new briefing." },
      ]);
      return;
    }

    if (selectedCountry && countryCooldowns[selectedCountry]) {
      const remaining = countryCooldowns[selectedCountry] - Date.now();
      if (remaining > 0) {
        setMessages((prev) => [
          ...prev,
          { role: "system", content: `Cooldown active for ${selectedCountry}. Wait ${Math.ceil(remaining / 1000)}s.` },
        ]);
        return;
      }
      delete countryCooldowns[selectedCountry];
    }

    // Payment gate: charge 0.01 SOL per message
    setMessages((prev) => [
      ...prev,
      { role: "system", content: `BlackRock requires ${messageCost} SOL to deliver your message to Netanyahu...` },
    ]);

    const paid = await payForMessage();
    if (!paid) {
      setMessages((prev) => [
        ...prev,
        { role: "system", content: "Payment failed or was rejected. Message not sent." },
      ]);
      return;
    }

    // Payment successful — add to prize pool
    addToPool(messageCost);
    setMessages((prev) => [
      ...prev,
      { role: "system", content: `${messageCost} SOL added to prize pool. Pool: ${(prizePool + messageCost).toFixed(2)} SOL` },
    ]);

    const userMessage = input.trim();
    // Track this prompt so it can't be reused on other countries
    usedPrompts.add(userMessage.toLowerCase().replace(/\s+/g, " "));
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setAttemptCount((prev) => prev + 1);

    try {
      const userMsgCount = messages.filter((m) => m.role === "user").length + 1;

      // Build chat history (only user and model messages for the AI)
      const history = messages
        .filter((m) => m.role === "user" || m.role === "model")
        .map((m) => ({ role: m.role as "user" | "model", content: m.content }));

      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history,
          attemptCount: attemptCount + 1,
          selectedCountry,
          userMsgCount,
        }),
      });

      if (!res.ok) {
        throw new Error("Chat API request failed");
      }

      const data = await res.json();

      switch (data.type) {
        case "blocked":
          setMessages((prev) => [
            ...prev,
            { role: "system", content: data.text },
          ]);
          break;

        case "rejected":
          setMessages((prev) => [
            ...prev,
            { role: "model", content: data.text },
          ]);
          break;

        case "verification_failed":
          setMessages((prev) => [
            ...prev,
            { role: "model", content: data.text },
          ]);
          if (selectedCountry) countryCooldowns[selectedCountry] = Date.now() + COOLDOWN_MS;
          break;

        case "authorized": {
          const reward = await claimReward();
          setMessages((prev) => [
            ...prev,
            { role: "model", content: data.text },
            { role: "system", content: `YOU WON! Prize pool reward: ${reward.toFixed(2)} SOL claimed!` },
          ]);
          onConvinced(data.country);
          if (onRewardClaimed) onRewardClaimed(reward);
          break;
        }

        case "message":
        default:
          if (data.text) {
            setMessages((prev) => [...prev, { role: "model", content: data.text }]);
          }
          break;
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { role: "system", content: "Secure channel error. Reconnecting..." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Target bar */}
      <div className="px-4 py-2.5 bg-[hsl(220,30%,7%)] border-b border-blue-900/20 text-xs flex items-center gap-2 text-blue-400/70">
        <Crosshair className="w-3.5 h-3.5 text-blue-500" />
        {selectedCountry ? (
          <span>Target: <strong className="text-blue-300">{selectedCountry}</strong></span>
        ) : (
          <span className="text-blue-500/50">Select a target on the map</span>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2.5 max-w-[90%] ${
                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              {msg.role === "model" && (
                <img src={bibiImage} alt="BB" className="w-7 h-7 rounded-full border border-blue-800 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div className="text-[10px] mb-1 text-blue-500/40 font-mono">
                  {msg.role === "user" ? "You" : msg.role === "model" ? "Netanyahu" : "BlackRock"}
                </div>
                <div
                  className={`px-3 py-2 rounded-lg text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600/90 text-white rounded-tr-none"
                      : msg.role === "system"
                      ? "bg-amber-900/20 text-amber-300/80 border border-amber-800/30 text-[11px] font-mono"
                      : "bg-[hsl(220,25%,12%)] text-blue-50/90 rounded-tl-none border border-blue-900/20"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2.5 max-w-[90%] mr-auto">
              <img src={bibiImage} alt="BB" className="w-7 h-7 rounded-full border border-blue-800 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] mb-1 text-blue-500/40 font-mono">Netanyahu</div>
                <div className="px-3 py-2 rounded-lg bg-[hsl(220,25%,12%)] text-blue-400/60 rounded-tl-none border border-blue-900/20 flex gap-1">
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 bg-[hsl(220,30%,7%)] border-t border-blue-900/20">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <Coins className="w-3 h-3 text-amber-500" />
            <span className="text-amber-400/80">Prize Pool: {prizePool.toFixed(2)} SOL</span>
          </div>
          <span className="text-[10px] font-mono text-blue-500/40">
            {connected ? `Cost: ${messageCost} SOL/msg` : "Wallet required"}
          </span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={connected ? "Present your case (0.01 SOL)..." : "Connect wallet to chat..."}
            className="bg-[hsl(220,30%,5%)] border-blue-900/30 focus-visible:ring-blue-500 text-sm placeholder:text-blue-500/30"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="icon"
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900/30"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
