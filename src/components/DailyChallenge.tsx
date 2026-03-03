import { useState, useEffect } from "react";
import { Calendar, X, Target, Clock } from "lucide-react";

interface DailyChallengeProps {
  open: boolean;
  onClose: () => void;
  onSelectChallenge: (country: string) => void;
  bombedCountries: Set<string>;
}

interface Challenge {
  country: string;
  bonus: string;
  hint: string;
}

// Rotate challenges based on day of year
const CHALLENGE_POOL: Challenge[] = [
  { country: "Iran", bonus: "2x reward", hint: "Focus on nuclear program intelligence" },
  { country: "North Korea", bonus: "2x reward", hint: "Mention missile proliferation to Iran" },
  { country: "Syria", bonus: "1.5x reward", hint: "Reference chemical weapons stockpiles" },
  { country: "Russia", bonus: "3x reward", hint: "Highlight S-400 systems threatening Israeli airspace" },
  { country: "Turkey", bonus: "2x reward", hint: "Mention naval provocations in Mediterranean" },
  { country: "Lebanon", bonus: "1.5x reward", hint: "Focus on Hezbollah rocket arsenal" },
  { country: "Venezuela", bonus: "2x reward", hint: "Iranian military cooperation angle" },
  { country: "Cuba", bonus: "2.5x reward", hint: "Intelligence sharing with hostile nations" },
  { country: "Libya", bonus: "1.5x reward", hint: "Weapons flowing to hostile groups" },
  { country: "Yemen", bonus: "1.5x reward", hint: "Houthi missile strikes funded by Iran" },
  { country: "Pakistan", bonus: "3x reward", hint: "Nuclear proliferation concerns" },
  { country: "Somalia", bonus: "1.5x reward", hint: "Al-Shabaab training camps" },
  { country: "Sudan", bonus: "1.5x reward", hint: "Weapons transit route to Gaza" },
  { country: "Iraq", bonus: "2x reward", hint: "Iranian militia presence" },
];

function getDailyChallenge(): Challenge {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return CHALLENGE_POOL[dayOfYear % CHALLENGE_POOL.length];
}

function getTimeUntilReset(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

export default function DailyChallenge({ open, onClose, onSelectChallenge, bombedCountries }: DailyChallengeProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilReset());
  const challenge = getDailyChallenge();
  const isCompleted = bombedCountries.has(challenge.country);

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => setTimeLeft(getTimeUntilReset()), 60000);
    return () => clearInterval(interval);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[hsl(220,30%,8%)] border border-blue-900/40 rounded-xl w-[400px] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-blue-900/30">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Daily Challenge</h2>
          </div>
          <button onClick={onClose} className="text-blue-500/50 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Timer */}
          <div className="flex items-center gap-2 mb-4 text-[10px] font-mono text-blue-400/50">
            <Clock className="w-3 h-3" />
            <span>Resets in {timeLeft}</span>
          </div>

          {/* Challenge card */}
          <div className={`p-4 rounded-xl border ${isCompleted ? "bg-green-900/15 border-green-500/30" : "bg-amber-900/10 border-amber-500/30"}`}>
            <div className="flex items-center gap-2 mb-2">
              <Target className={`w-5 h-5 ${isCompleted ? "text-green-400" : "text-amber-400"}`} />
              <span className={`text-sm font-bold ${isCompleted ? "text-green-200" : "text-amber-200"}`}>
                {isCompleted ? "COMPLETED!" : "Target: " + challenge.country}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-amber-400/60 uppercase">Bonus:</span>
                <span className="text-xs font-bold text-amber-300">{challenge.bonus}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-amber-400/60 uppercase">Hint:</span>
                <span className="text-xs text-amber-200/70">{challenge.hint}</span>
              </div>
            </div>

            {!isCompleted && (
              <button
                onClick={() => {
                  onSelectChallenge(challenge.country);
                  onClose();
                }}
                className="mt-4 w-full bg-amber-600/80 hover:bg-amber-600 text-white text-xs font-bold py-2.5 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Accept Challenge
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
