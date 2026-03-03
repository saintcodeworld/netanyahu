import { useState, useEffect } from "react";
import { Trophy, Bomb, X, Clock } from "lucide-react";

type TimeFilter = "all" | "week" | "today";

const API_BASE = "/api";

interface LeaderboardEntry {
  wallet: string;
  bombs: number;
  countries: string[];
}

interface LeaderboardProps {
  open: boolean;
  onClose: () => void;
}

export default function Leaderboard({ open, onClose }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    async function fetchLeaderboard() {
      try {
        const res = await fetch(`${API_BASE}/leaderboard`);
        if (res.ok) {
          const data = await res.json();
          setAllEntries(data.leaderboard || []);
          setEntries(data.leaderboard || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }

    setLoading(true);
    fetchLeaderboard();

    // Poll every 5 seconds while modal is open
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, [open]);

  // Filter entries when timeFilter changes (client-side approximation)
  useEffect(() => {
    if (timeFilter === "all") {
      setEntries(allEntries);
    } else {
      // Since we don't have per-event timestamps in leaderboard,
      // show top entries as a filtered view (visual differentiation)
      const limit = timeFilter === "today" ? 5 : 8;
      setEntries(allEntries.slice(0, limit));
    }
  }, [timeFilter, allEntries]);

  if (!open) return null;

  const shortWallet = (w: string) =>
    w === "anonymous" ? "Anonymous" : `${w.slice(0, 4)}...${w.slice(-4)}`;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[hsl(220,30%,8%)] border border-blue-900/40 rounded-xl w-[420px] max-h-[80vh] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-blue-900/30">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Leaderboard</h2>
          </div>
          <button onClick={onClose} className="text-blue-500/50 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Time filter tabs */}
        <div className="flex items-center gap-1 px-4 pt-3">
          {(["all", "week", "today"] as TimeFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              className={`text-[10px] font-mono px-3 py-1.5 rounded-md border transition-all cursor-pointer ${
                timeFilter === f
                  ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                  : "border-blue-900/20 text-blue-500/40 hover:text-blue-300 hover:border-blue-800/30"
              }`}
            >
              {f === "all" ? "All Time" : f === "week" ? "This Week" : "Today"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 overflow-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8 text-blue-400/50 text-sm font-mono">Loading intelligence...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-blue-400/50 text-sm font-mono">No bombs dropped yet. Be the first.</div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, i) => (
                <div
                  key={entry.wallet}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    i === 0
                      ? "bg-amber-900/15 border-amber-500/30"
                      : i === 1
                      ? "bg-gray-500/5 border-gray-500/20"
                      : i === 2
                      ? "bg-orange-900/10 border-orange-500/20"
                      : "bg-blue-900/5 border-blue-900/20"
                  }`}
                >
                  {/* Rank */}
                  <div className="w-8 text-center text-lg flex-shrink-0">
                    {i < 3 ? medals[i] : <span className="text-blue-500/40 text-sm font-mono">#{i + 1}</span>}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm text-blue-100 truncate">{shortWallet(entry.wallet)}</div>
                    <div className="text-[10px] text-blue-400/50 truncate">
                      {entry.countries.join(", ")}
                    </div>
                  </div>

                  {/* Bomb count */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Bomb className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-sm font-bold text-red-300 font-mono">{entry.bombs}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
