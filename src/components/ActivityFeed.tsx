import { useState, useEffect, useRef } from "react";
import { Radio, Bomb, ChevronDown, ChevronUp } from "lucide-react";

const API_BASE = "/api";

interface ActivityEntry {
  country: string;
  wallet: string;
  timestamp: number;
}

export default function ActivityFeed() {
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [newEntryIds, setNewEntryIds] = useState<Set<number>>(new Set());
  const prevCountRef = useRef(0);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch(`${API_BASE}/leaderboard`);
        if (res.ok) {
          const data = await res.json();
          setActivity(data.activity || []);
        }
      } catch {
        // silent
      }
    }
    fetchActivity();
    const interval = setInterval(fetchActivity, 5000);
    return () => clearInterval(interval);
  }, []);

  // Track new entries for pulse animation
  useEffect(() => {
    if (activity.length > prevCountRef.current && prevCountRef.current > 0) {
      const newIds = new Set<number>();
      activity.slice(0, activity.length - prevCountRef.current).forEach((e) => newIds.add(e.timestamp));
      setNewEntryIds(newIds);
      setTimeout(() => setNewEntryIds(new Set()), 2000);
    }
    prevCountRef.current = activity.length;
  }, [activity]);

  const shortWallet = (w: string) =>
    w === "anonymous" ? "Anon" : `${w.slice(0, 4)}...${w.slice(-4)}`;

  const timeAgo = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (activity.length === 0) return null;

  const visibleCount = expanded ? 20 : 5;

  return (
    <div className="absolute bottom-4 right-4 z-20 w-[240px]">
      <div className="bg-black/70 backdrop-blur-md border border-red-900/30 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-red-900/20">
          <Radio className="w-3 h-3 text-red-400 animate-pulse" />
          <span className="text-[10px] font-mono text-red-400/80 uppercase tracking-widest flex-1">Live Feed</span>
          <span className="text-[9px] font-mono text-red-500/40">{activity.length}</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-red-500/40 hover:text-red-300 transition-colors cursor-pointer ml-1"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>

        {/* Entries */}
        <div className={`overflow-auto transition-all duration-300 ${expanded ? "max-h-[400px]" : "max-h-[160px]"}`}>
          {activity.slice(0, visibleCount).map((entry, i) => (
            <div
              key={`${entry.timestamp}-${i}`}
              className={`flex items-center gap-2 px-3 py-1.5 border-b border-red-900/10 last:border-0 transition-colors ${
                newEntryIds.has(entry.timestamp) ? "animate-activity-pulse" : ""
              }`}
            >
              <Bomb className="w-3 h-3 text-red-500/60 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] text-red-200/80 font-mono truncate block">
                  {shortWallet(entry.wallet)} bombed <strong className="text-red-300">{entry.country}</strong>
                </span>
              </div>
              <span className="text-[9px] text-red-500/40 font-mono flex-shrink-0">{timeAgo(entry.timestamp)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
