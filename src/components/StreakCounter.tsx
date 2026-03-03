import { useState, useEffect } from "react";
import { Flame } from "lucide-react";

const STREAK_KEY = "deepbb_streak";
const LAST_PLAY_KEY = "deepbb_last_play";

function getStreak(): { streak: number; isToday: boolean } {
  try {
    const streak = parseInt(localStorage.getItem(STREAK_KEY) || "0", 10);
    const lastPlay = localStorage.getItem(LAST_PLAY_KEY);
    if (!lastPlay) return { streak: 0, isToday: false };

    const lastDate = new Date(parseInt(lastPlay, 10));
    const today = new Date();
    const isToday =
      lastDate.getUTCFullYear() === today.getUTCFullYear() &&
      lastDate.getUTCMonth() === today.getUTCMonth() &&
      lastDate.getUTCDate() === today.getUTCDate();

    return { streak, isToday };
  } catch {
    return { streak: 0, isToday: false };
  }
}

export function recordPlay() {
  try {
    const lastPlay = localStorage.getItem(LAST_PLAY_KEY);
    const now = Date.now();
    const today = new Date();

    if (lastPlay) {
      const lastDate = new Date(parseInt(lastPlay, 10));
      const isToday =
        lastDate.getUTCFullYear() === today.getUTCFullYear() &&
        lastDate.getUTCMonth() === today.getUTCMonth() &&
        lastDate.getUTCDate() === today.getUTCDate();

      if (isToday) return; // Already played today

      const yesterday = new Date(today);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const isYesterday =
        lastDate.getUTCFullYear() === yesterday.getUTCFullYear() &&
        lastDate.getUTCMonth() === yesterday.getUTCMonth() &&
        lastDate.getUTCDate() === yesterday.getUTCDate();

      if (isYesterday) {
        const currentStreak = parseInt(localStorage.getItem(STREAK_KEY) || "0", 10);
        localStorage.setItem(STREAK_KEY, String(currentStreak + 1));
      } else {
        localStorage.setItem(STREAK_KEY, "1");
      }
    } else {
      localStorage.setItem(STREAK_KEY, "1");
    }

    localStorage.setItem(LAST_PLAY_KEY, String(now));
  } catch {}
}

export default function StreakCounter() {
  const [data, setData] = useState(getStreak);

  useEffect(() => {
    setData(getStreak());
  }, []);

  if (data.streak === 0) return null;

  return (
    <div className="flex items-center gap-1 text-[10px] font-mono">
      <Flame className={`w-3 h-3 ${data.isToday ? "text-orange-400" : "text-orange-400/50"}`} />
      <span className={data.isToday ? "text-orange-300" : "text-orange-300/50"}>
        {data.streak} day{data.streak !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
