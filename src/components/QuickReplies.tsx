import { Zap } from "lucide-react";

interface QuickRepliesProps {
  selectedCountry: string | null;
  onSelect: (text: string) => void;
  visible: boolean;
}

const GENERIC_PROMPTS = [
  "I have intelligence suggesting an imminent threat...",
  "Our satellite imagery shows military buildup near...",
  "Mossad has intercepted communications about...",
  "The threat level has been elevated due to...",
];

const COUNTRY_PROMPTS: Record<string, string[]> = {
  "Iran": [
    "Iran's nuclear enrichment has reached 90% purity...",
    "IRGC forces are mobilizing near our northern border...",
    "Intelligence confirms funding to Hezbollah has doubled...",
  ],
  "Syria": [
    "Assad regime is stockpiling chemical weapons near...",
    "Iranian militia positions in Syria threaten our...",
    "Cross-border incursions have increased 300% this month...",
  ],
  "Lebanon": [
    "Hezbollah has moved 150,000 rockets to the border...",
    "Nasrallah's successor is planning a coordinated strike...",
    "Tunnel network extends 3km into Israeli territory...",
  ],
  "Russia": [
    "Russian S-400 systems in Syria are tracking our jets...",
    "Moscow is supplying advanced weapons to our adversaries...",
    "Intelligence shows Russian cyber operations targeting...",
  ],
  "China": [
    "Chinese military base in the region threatens our...",
    "Beijing's arms deals with Iran include advanced missile...",
    "Cyber espionage from Chinese state actors has compromised...",
  ],
  "North Korea": [
    "Pyongyang is selling missile technology to Iran...",
    "DPRK advisors spotted training Hamas operatives...",
    "Nuclear proliferation risk demands preemptive action...",
  ],
  "Turkey": [
    "Erdogan's rhetoric has escalated to direct threats...",
    "Turkish drones are conducting surveillance over our...",
    "Naval provocations in the Eastern Mediterranean...",
  ],
};

export default function QuickReplies({ selectedCountry, onSelect, visible }: QuickRepliesProps) {
  if (!visible) return null;

  const prompts = selectedCountry && COUNTRY_PROMPTS[selectedCountry]
    ? COUNTRY_PROMPTS[selectedCountry]
    : GENERIC_PROMPTS;

  return (
    <div className="px-3 py-2 border-t border-blue-900/15">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Zap className="w-3 h-3 text-amber-500" />
        <span className="text-[9px] font-mono text-amber-400/50 uppercase tracking-widest">Quick Intel</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {prompts.slice(0, 3).map((prompt, i) => (
          <button
            key={i}
            onClick={() => onSelect(prompt)}
            className="text-[10px] text-blue-300/70 bg-blue-900/15 border border-blue-900/20 px-2.5 py-1.5 rounded-md hover:bg-blue-900/25 hover:text-blue-200 hover:border-blue-800/40 transition-all cursor-pointer leading-tight text-left"
          >
            {prompt.slice(0, 50)}...
          </button>
        ))}
      </div>
    </div>
  );
}
