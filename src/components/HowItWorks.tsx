import { useEffect } from "react";
import { X, Wallet, MessageSquare, Bomb, Trophy, ArrowDown } from "lucide-react";

interface HowItWorksProps {
  open: boolean;
  onClose: () => void;
}

export default function HowItWorks({ open, onClose }: HowItWorksProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const steps = [
    {
      icon: <Wallet className="w-5 h-5 text-blue-400" />,
      title: "Connect Wallet",
      desc: "Connect your Phantom wallet to get started.",
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-amber-400" />,
      title: "Pay & Chat",
      desc: "Each message costs 0.01 SOL. That SOL goes straight into the prize pool.",
    },
    {
      icon: <Bomb className="w-5 h-5 text-red-400" />,
      title: "Convince Netanyahu",
      desc: "Pick a country on the map. Write a convincing argument to authorize a strike. No lazy prompts — he demands real intelligence.",
    },
    {
      icon: <Trophy className="w-5 h-5 text-green-400" />,
      title: "Win 1 SOL Reward",
      desc: "If you convince him, you earn a 1 SOL reward. The prize pool keeps growing with every player's messages.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[hsl(220,30%,8%)] border border-blue-900/40 rounded-xl w-[440px] max-h-[85vh] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-blue-900/30">
          <h2 className="text-lg font-bold text-white">How It Works</h2>
          <button onClick={onClose} className="text-blue-500/50 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps */}
        <div className="p-5 space-y-1">
          {steps.map((step, i) => (
            <div key={i}>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-900/5 border border-blue-900/15">
                <div className="w-9 h-9 rounded-full bg-blue-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {step.icon}
                </div>
                <div>
                  <div className="text-sm font-bold text-blue-100">{step.title}</div>
                  <div className="text-[12px] text-blue-300/60 leading-relaxed mt-0.5">{step.desc}</div>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="w-3.5 h-3.5 text-blue-500/25" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Money Flow */}
        <div className="mx-5 mb-5 p-4 rounded-lg bg-amber-900/10 border border-amber-500/20">
          <div className="text-[11px] uppercase tracking-widest text-amber-400/70 font-mono mb-2">Money Flow</div>
          <div className="space-y-1.5 text-[12px] text-amber-200/70">
            <div className="flex items-center gap-2">
              <span className="text-amber-400">1.</span> You pay <strong className="text-amber-300">0.01 SOL</strong> per message
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400">2.</span> SOL goes to the <strong className="text-amber-300">prize pool</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400">3.</span> Pool grows with every player's messages
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400">4.</span> Convince Netanyahu and <strong className="text-green-300">win 1 SOL reward</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400">5.</span> Prize pool keeps growing — more players = bigger pool
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
