import { useState } from "react";
import { Trophy, X, Lock } from "lucide-react";
import { useAchievements } from "../context/AchievementContext";

interface AchievementPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AchievementPanel({ open, onClose }: AchievementPanelProps) {
  const { achievements, totalUnlocked } = useAchievements();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[hsl(220,30%,8%)] border border-blue-900/40 rounded-xl w-[440px] max-h-[80vh] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-blue-900/30">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Achievements</h2>
            <span className="text-xs font-mono text-amber-400/70 ml-2">
              {totalUnlocked}/{achievements.length}
            </span>
          </div>
          <button onClick={onClose} className="text-blue-500/50 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-auto max-h-[60vh]">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="h-2 bg-blue-900/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-700"
                style={{ width: `${(totalUnlocked / achievements.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-3 rounded-lg border transition-all ${
                  achievement.unlocked
                    ? "bg-amber-900/15 border-amber-500/30"
                    : "bg-blue-900/5 border-blue-900/20 opacity-50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{achievement.unlocked ? achievement.icon : "🔒"}</span>
                  <span className={`text-xs font-bold ${achievement.unlocked ? "text-amber-200" : "text-blue-400/50"}`}>
                    {achievement.title}
                  </span>
                </div>
                <p className={`text-[10px] leading-relaxed ${achievement.unlocked ? "text-amber-300/60" : "text-blue-500/30"}`}>
                  {achievement.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AchievementToast() {
  const { newlyUnlocked, dismissNewAchievement } = useAchievements();

  if (!newlyUnlocked) return null;

  return (
    <div className="fixed top-4 right-4 z-[60] animate-slide-in-right">
      <div className="bg-gradient-to-r from-amber-900/90 to-amber-800/90 backdrop-blur-md border border-amber-500/40 rounded-xl px-5 py-3 shadow-2xl shadow-amber-500/20 flex items-center gap-3 min-w-[280px]">
        <span className="text-2xl">{newlyUnlocked.icon}</span>
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-widest text-amber-400/70 font-mono">Achievement Unlocked!</div>
          <div className="text-sm font-bold text-amber-100">{newlyUnlocked.title}</div>
          <div className="text-[10px] text-amber-300/60">{newlyUnlocked.description}</div>
        </div>
        <button onClick={dismissNewAchievement} className="text-amber-500/50 hover:text-amber-200 cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
