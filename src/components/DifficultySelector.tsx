import { useState } from "react";
import { Shield, ShieldAlert, ShieldOff } from "lucide-react";

export type Difficulty = "easy" | "medium" | "hard";

interface DifficultySelectorProps {
  difficulty: Difficulty;
  onChangeDifficulty: (d: Difficulty) => void;
}

const DIFFICULTIES: { value: Difficulty; label: string; icon: React.ReactNode; desc: string; color: string }[] = [
  {
    value: "easy",
    label: "Dove",
    icon: <ShieldOff className="w-3 h-3" />,
    desc: "Netanyahu is more open to persuasion",
    color: "text-green-400 border-green-500/30 bg-green-900/10",
  },
  {
    value: "medium",
    label: "Hawk",
    icon: <Shield className="w-3 h-3" />,
    desc: "Standard difficulty — demands real intel",
    color: "text-amber-400 border-amber-500/30 bg-amber-900/10",
  },
  {
    value: "hard",
    label: "Iron Dome",
    icon: <ShieldAlert className="w-3 h-3" />,
    desc: "Nearly impossible to convince",
    color: "text-red-400 border-red-500/30 bg-red-900/10",
  },
];

export default function DifficultySelector({ difficulty, onChangeDifficulty }: DifficultySelectorProps) {
  const [expanded, setExpanded] = useState(false);

  const current = DIFFICULTIES.find((d) => d.value === difficulty)!;

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded-md border transition-all cursor-pointer ${current.color}`}
      >
        {current.icon}
        {current.label}
      </button>

      {expanded && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setExpanded(false)} />
          <div className="absolute top-full mt-1 right-0 z-50 bg-[hsl(220,30%,8%)] border border-blue-900/40 rounded-lg shadow-2xl overflow-hidden w-[200px]">
            <div className="px-3 py-2 border-b border-blue-900/20">
              <span className="text-[10px] font-mono text-blue-400/50 uppercase tracking-widest">Difficulty</span>
            </div>
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                onClick={() => {
                  onChangeDifficulty(d.value);
                  setExpanded(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-blue-900/15 transition-colors cursor-pointer flex items-start gap-2 ${
                  difficulty === d.value ? "bg-blue-900/10" : ""
                }`}
              >
                <span className={`mt-0.5 ${DIFFICULTIES.find((dd) => dd.value === d.value)!.color.split(" ")[0]}`}>
                  {d.icon}
                </span>
                <div>
                  <div className={`text-xs font-bold ${DIFFICULTIES.find((dd) => dd.value === d.value)!.color.split(" ")[0]}`}>
                    {d.label}
                  </div>
                  <div className="text-[9px] text-blue-400/40">{d.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
