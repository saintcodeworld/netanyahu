import { useState, useEffect } from "react";
import { BarChart3, X, Globe, Bomb, Users, TrendingUp } from "lucide-react";

const API_BASE = "/api";

interface GlobalStatsProps {
  open: boolean;
  onClose: () => void;
  bombedCount: number;
}

interface StatsData {
  totalBombs: number;
  topTarget: string | null;
  uniqueWallets: number;
  recentBombs: number;
}

export default function GlobalStats({ open, onClose, bombedCount }: GlobalStatsProps) {
  const [stats, setStats] = useState<StatsData>({
    totalBombs: 0,
    topTarget: null,
    uniqueWallets: 0,
    recentBombs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;

    async function fetchStats() {
      try {
        const res = await fetch(`${API_BASE}/leaderboard`);
        if (res.ok) {
          const data = await res.json();
          const leaderboard = data.leaderboard || [];
          const activity = data.activity || [];

          const totalBombs = leaderboard.reduce((sum: number, e: any) => sum + e.bombs, 0);
          const uniqueWallets = leaderboard.length;

          // Find most targeted — count countries across all entries
          const countryCount: Record<string, number> = {};
          leaderboard.forEach((e: any) => {
            e.countries.forEach((c: string) => {
              countryCount[c] = (countryCount[c] || 0) + 1;
            });
          });
          const topTarget = Object.entries(countryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

          // Recent = last hour
          const oneHourAgo = Date.now() - 3600_000;
          const recentBombs = activity.filter((a: any) => a.timestamp > oneHourAgo).length;

          setStats({ totalBombs, topTarget, uniqueWallets, recentBombs });
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }

    setLoading(true);
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [open]);

  if (!open) return null;

  const statCards = [
    { icon: <Bomb className="w-4 h-4 text-red-400" />, label: "Total Strikes", value: stats.totalBombs, color: "text-red-300" },
    { icon: <Globe className="w-4 h-4 text-amber-400" />, label: "Countries Hit", value: bombedCount, color: "text-amber-300" },
    { icon: <Users className="w-4 h-4 text-blue-400" />, label: "Active Agents", value: stats.uniqueWallets, color: "text-blue-300" },
    { icon: <TrendingUp className="w-4 h-4 text-green-400" />, label: "Last Hour", value: stats.recentBombs, color: "text-green-300" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[hsl(220,30%,8%)] border border-blue-900/40 rounded-xl w-[420px] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-blue-900/30">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Global Intel</h2>
          </div>
          <button onClick={onClose} className="text-blue-500/50 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-8 text-blue-400/50 text-sm font-mono">Gathering intelligence...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {statCards.map((stat) => (
                  <div key={stat.label} className="bg-blue-900/10 border border-blue-900/20 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      {stat.icon}
                      <span className="text-[10px] text-blue-400/50 font-mono uppercase">{stat.label}</span>
                    </div>
                    <div className={`text-xl font-black font-mono ${stat.color}`}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {stats.topTarget && (
                <div className="bg-red-900/10 border border-red-900/20 rounded-lg p-3">
                  <div className="text-[10px] text-red-400/50 font-mono uppercase mb-1">Most Targeted Country</div>
                  <div className="text-sm font-bold text-red-300">{stats.topTarget}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
