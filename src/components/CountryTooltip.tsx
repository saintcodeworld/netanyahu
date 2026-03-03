interface CountryTooltipProps {
  country: string | null;
  position: { x: number; y: number } | null;
  isBombed: boolean;
  isAlly: boolean;
  isIsrael: boolean;
}

const COUNTRY_INFO: Record<string, { population: string; region: string; difficulty: string }> = {
  "Russia": { population: "144M", region: "Eastern Europe", difficulty: "Hard" },
  "China": { population: "1.4B", region: "East Asia", difficulty: "Very Hard" },
  "Iran": { population: "87M", region: "Middle East", difficulty: "Medium" },
  "North Korea": { population: "26M", region: "East Asia", difficulty: "Medium" },
  "Syria": { population: "22M", region: "Middle East", difficulty: "Easy" },
  "Lebanon": { population: "5.5M", region: "Middle East", difficulty: "Easy" },
  "Turkey": { population: "85M", region: "Middle East", difficulty: "Medium" },
  "India": { population: "1.4B", region: "South Asia", difficulty: "Hard" },
  "Pakistan": { population: "230M", region: "South Asia", difficulty: "Hard" },
  "France": { population: "68M", region: "Western Europe", difficulty: "Hard" },
  "Germany": { population: "84M", region: "Western Europe", difficulty: "Hard" },
  "Japan": { population: "125M", region: "East Asia", difficulty: "Hard" },
  "Brazil": { population: "215M", region: "South America", difficulty: "Medium" },
  "Australia": { population: "26M", region: "Oceania", difficulty: "Hard" },
  "Canada": { population: "40M", region: "North America", difficulty: "Hard" },
  "Mexico": { population: "130M", region: "North America", difficulty: "Medium" },
  "Egypt": { population: "104M", region: "North Africa", difficulty: "Medium" },
  "Saudi Arabia": { population: "36M", region: "Middle East", difficulty: "Medium" },
  "South Korea": { population: "52M", region: "East Asia", difficulty: "Hard" },
  "Ukraine": { population: "44M", region: "Eastern Europe", difficulty: "Medium" },
  "Poland": { population: "38M", region: "Eastern Europe", difficulty: "Medium" },
  "Iraq": { population: "42M", region: "Middle East", difficulty: "Easy" },
  "Afghanistan": { population: "40M", region: "Central Asia", difficulty: "Easy" },
  "Yemen": { population: "33M", region: "Middle East", difficulty: "Easy" },
  "Libya": { population: "7M", region: "North Africa", difficulty: "Easy" },
  "Somalia": { population: "17M", region: "East Africa", difficulty: "Easy" },
  "Sudan": { population: "46M", region: "North Africa", difficulty: "Easy" },
  "Venezuela": { population: "28M", region: "South America", difficulty: "Medium" },
  "Cuba": { population: "11M", region: "Caribbean", difficulty: "Medium" },
};

function getDifficultyColor(diff: string) {
  switch (diff) {
    case "Easy": return "text-green-400";
    case "Medium": return "text-amber-400";
    case "Hard": return "text-red-400";
    case "Very Hard": return "text-red-500";
    default: return "text-blue-400";
  }
}

export default function CountryTooltip({ country, position, isBombed, isAlly, isIsrael }: CountryTooltipProps) {
  if (!country || !position || isIsrael) return null;

  const info = COUNTRY_INFO[country];

  return (
    <div
      className="fixed z-[55] pointer-events-none"
      style={{ left: position.x + 12, top: position.y - 10 }}
    >
      <div className="bg-black/90 backdrop-blur-md border border-blue-900/50 rounded-lg px-3 py-2 shadow-xl min-w-[160px]">
        <div className="flex items-center justify-between gap-3 mb-1">
          <span className="text-xs font-bold text-white">{country}</span>
          {isBombed && <span className="text-[9px] font-mono text-red-400 bg-red-900/30 px-1.5 py-0.5 rounded">BOMBED</span>}
          {isAlly && <span className="text-[9px] font-mono text-amber-400 bg-amber-900/30 px-1.5 py-0.5 rounded">ALLY</span>}
        </div>
        {info ? (
          <div className="space-y-0.5">
            <div className="text-[10px] text-blue-400/60 font-mono">
              Pop: <span className="text-blue-300/80">{info.population}</span>
            </div>
            <div className="text-[10px] text-blue-400/60 font-mono">
              Region: <span className="text-blue-300/80">{info.region}</span>
            </div>
            <div className="text-[10px] text-blue-400/60 font-mono">
              Difficulty: <span className={getDifficultyColor(info.difficulty)}>{info.difficulty}</span>
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-blue-400/40 font-mono">Intel limited</div>
        )}
        {!isBombed && !isAlly && (
          <div className="text-[9px] text-blue-500/40 mt-1 font-mono">Click to target</div>
        )}
      </div>
    </div>
  );
}
