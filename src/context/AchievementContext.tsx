import { createContext, useContext, useState, useCallback, useEffect, FC, ReactNode } from "react";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

const ACHIEVEMENT_DEFS: Omit<Achievement, "unlocked" | "unlockedAt">[] = [
  { id: "first_blood", title: "First Blood", description: "Bomb your first country", icon: "💣" },
  { id: "serial_bomber", title: "Serial Bomber", description: "Bomb 3 countries", icon: "🔥" },
  { id: "world_domination", title: "World Domination", description: "Bomb 10 countries", icon: "🌍" },
  { id: "speed_demon", title: "Speed Demon", description: "Convince Netanyahu in under 3 messages", icon: "⚡" },
  { id: "persistent", title: "Persistent", description: "Send 10 messages in one session", icon: "🎯" },
  { id: "diplomat", title: "Failed Diplomat", description: "Try to bomb a protected ally", icon: "🤝" },
  { id: "big_spender", title: "Big Spender", description: "Spend 0.1 SOL total on messages", icon: "💰" },
  { id: "strategist", title: "Master Strategist", description: "Bomb 5 countries", icon: "🧠" },
  { id: "first_login", title: "Welcome Agent", description: "Connect your wallet", icon: "👋" },
  { id: "test_pilot", title: "Test Pilot", description: "Use the test bomb feature", icon: "🧪" },
];

interface AchievementContextType {
  achievements: Achievement[];
  unlockAchievement: (id: string) => void;
  newlyUnlocked: Achievement | null;
  dismissNewAchievement: () => void;
  totalUnlocked: number;
}

const AchievementContext = createContext<AchievementContextType>({
  achievements: [],
  unlockAchievement: () => {},
  newlyUnlocked: null,
  dismissNewAchievement: () => {},
  totalUnlocked: 0,
});

export const useAchievements = () => useContext(AchievementContext);

const STORAGE_KEY = "deepbb_achievements";

function loadAchievements(): Achievement[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: Record<string, number> = JSON.parse(stored);
      return ACHIEVEMENT_DEFS.map((def) => ({
        ...def,
        unlocked: !!parsed[def.id],
        unlockedAt: parsed[def.id] || undefined,
      }));
    }
  } catch {}
  return ACHIEVEMENT_DEFS.map((def) => ({ ...def, unlocked: false }));
}

function saveAchievements(achievements: Achievement[]) {
  const map: Record<string, number> = {};
  achievements.forEach((a) => {
    if (a.unlocked && a.unlockedAt) map[a.id] = a.unlockedAt;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export const AchievementProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [achievements, setAchievements] = useState<Achievement[]>(loadAchievements);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement | null>(null);

  useEffect(() => {
    saveAchievements(achievements);
  }, [achievements]);

  const unlockAchievement = useCallback((id: string) => {
    setAchievements((prev) => {
      const existing = prev.find((a) => a.id === id);
      if (!existing || existing.unlocked) return prev;
      const now = Date.now();
      const updated = prev.map((a) =>
        a.id === id ? { ...a, unlocked: true, unlockedAt: now } : a
      );
      const achievement = updated.find((a) => a.id === id)!;
      setNewlyUnlocked(achievement);
      setTimeout(() => setNewlyUnlocked(null), 4000);
      return updated;
    });
  }, []);

  const dismissNewAchievement = useCallback(() => {
    setNewlyUnlocked(null);
  }, []);

  const totalUnlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <AchievementContext.Provider
      value={{ achievements, unlockAchievement, newlyUnlocked, dismissNewAchievement, totalUnlocked }}
    >
      {children}
    </AchievementContext.Provider>
  );
};
