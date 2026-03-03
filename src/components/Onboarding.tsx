import { useState, useEffect } from "react";
import { X, ChevronRight, Wallet, MapPin, MessageSquare, Bomb, Trophy } from "lucide-react";

const ONBOARDING_KEY = "deepbb_onboarding_seen";

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    icon: <Wallet className="w-8 h-8 text-blue-400" />,
    title: "Welcome, Agent",
    subtitle: "Your mission briefing starts now",
    body: "You've been recruited to advise Prime Minister Netanyahu on matters of national security. Your wallet is your clearance badge.",
    highlight: "Connect your Phantom wallet to begin.",
  },
  {
    icon: <MapPin className="w-8 h-8 text-amber-400" />,
    title: "Select Your Target",
    subtitle: "The world map awaits",
    body: "Click any country on the map to select it as your target. Israel and its allies are off-limits.",
    highlight: "Choose wisely — some targets are harder to justify than others.",
  },
  {
    icon: <MessageSquare className="w-8 h-8 text-green-400" />,
    title: "Make Your Case",
    subtitle: "Convince the PM",
    body: "Each message costs 0.01 SOL and feeds the prize pool. Write compelling intelligence briefings with real geopolitical context.",
    highlight: "Lazy arguments will be dismissed. Think like a strategist.",
  },
  {
    icon: <Bomb className="w-8 h-8 text-red-400" />,
    title: "Authorize the Strike",
    subtitle: "Watch the fireworks",
    body: "If your argument is convincing enough, Netanyahu will authorize the strike. Watch the F-15s scramble and the bombs drop.",
    highlight: "Win 1 SOL every time you convince him!",
  },
  {
    icon: <Trophy className="w-8 h-8 text-amber-400" />,
    title: "Earn Achievements",
    subtitle: "Become a legend",
    body: "Unlock achievements for milestones, earn your place on the leaderboard, and compete with other agents worldwide.",
    highlight: "Ready to begin?",
  },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_KEY);
    if (!seen) {
      setVisible(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setVisible(false);
    onComplete();
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!visible) return null;

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-[hsl(220,30%,8%)] border border-blue-900/40 rounded-2xl w-[480px] shadow-2xl overflow-hidden">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-8 bg-blue-500" : i < step ? "w-4 bg-blue-500/50" : "w-4 bg-blue-900/40"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-900/20 border border-blue-900/30 flex items-center justify-center mx-auto mb-5">
            {current.icon}
          </div>
          <h2 className="text-xl font-bold text-white mb-1">{current.title}</h2>
          <p className="text-xs text-blue-400/60 font-mono mb-4">{current.subtitle}</p>
          <p className="text-sm text-blue-100/70 leading-relaxed mb-3">{current.body}</p>
          <p className="text-xs text-amber-400/80 font-medium">{current.highlight}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 pb-6">
          <button
            onClick={handleSkip}
            className="text-xs text-blue-500/40 hover:text-blue-300 transition-colors font-mono cursor-pointer"
          >
            Skip Tutorial
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-6 py-2.5 rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            {step < steps.length - 1 ? "Next" : "Start Mission"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
