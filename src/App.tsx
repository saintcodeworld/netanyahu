/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from "react";
import MapComponent from "./components/Map";
import ChatComponent from "./components/Chat";
import WalletConnect from "./components/WalletConnect";
import Leaderboard from "./components/Leaderboard";
import ActivityFeed from "./components/ActivityFeed";
import HowItWorks from "./components/HowItWorks";
import { AchievementPanel, AchievementToast } from "./components/AchievementBadge";
import CountryTooltip from "./components/CountryTooltip";
import SoundToggle from "./components/SoundToggle";
import Onboarding from "./components/Onboarding";
import GlobalStats from "./components/GlobalStats";
import DailyChallenge from "./components/DailyChallenge";
import StreakCounter, { recordPlay } from "./components/StreakCounter";
import confetti from "canvas-confetti";
import { usePrizePool } from "./context/PrizePoolContext";
import { useBombSync } from "./hooks/useBombSync";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAchievements } from "./context/AchievementContext";
import { useSoundSettings } from "./context/SoundContext";
import type { Difficulty } from "./components/DifficultySelector";
import bibiImage from "/assets/DeepBB.png";

const PROTECTED_ALLIES = new Set(["United States of America", "United States", "United Kingdom"]);

export default function App() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [targetCentroid, setTargetCentroid] = useState<[number, number] | null>(null);
  const [isConvinced, setIsConvinced] = useState(false);
  const [bombPhase, setBombPhase] = useState<"idle" | "circling" | "missile" | "explode" | "done">("idle");
  const [transferStatus, setTransferStatus] = useState<string | null>(null);
  const [lastReward, setLastReward] = useState<number>(0);
  const [animatingCountry, setAnimatingCountry] = useState<string | null>(null);
  const [isTestBomb, setIsTestBomb] = useState(false);
  const { prizePool } = usePrizePool();
  const { bombedCountries, pendingAnimations, consumeAnimation, reportBomb } = useBombSync();
  const { publicKey, connected } = useWallet();
  const { unlockAchievement } = useAchievements();
  const { soundEnabled } = useSoundSettings();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showGlobalStats, setShowGlobalStats] = useState(false);
  const [showDailyChallenge, setShowDailyChallenge] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Unlock wallet achievement
  useEffect(() => {
    if (connected) unlockAchievement("first_login");
  }, [connected]);

  // Record streak on mount
  useEffect(() => { recordPlay(); }, []);

  const handleRewardClaimed = (amount: number) => {
    setLastReward(amount);
  };

  // BroadcastChannel for live cross-tab sync within the same browser
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const ch = new BroadcastChannel("deepbb-bombed");
    channelRef.current = ch;
    return () => ch.close();
  }, []);

  const animationInProgress = useRef(false);

  const triggerBomb = (country: string | null, centroid?: [number, number] | null, isRemote = false, testOnly = false) => {
    if (!country) return;
    if (animationInProgress.current) return;
    animationInProgress.current = true;
    setIsTestBomb(testOnly);

    // If a centroid is passed (for remote events), update targetCentroid so the map shows the animation
    if (centroid) {
      setTargetCentroid(centroid);
    }
    setAnimatingCountry(country);

    // Play bomb sound synced with the full mission (14s)
    if (soundEnabled) {
      const audio = new Audio("/bomb sound.mp3");
      audio.volume = 1;
      audio.play().catch(() => {});
    }
    // Phase 1: F-15s circle around Israel for 5 seconds
    setBombPhase("circling");

    // Phase 2: F-15s fly to target country (4 seconds)
    setTimeout(() => setBombPhase("missile"), 5000);
    // Phase 3: Explosion exactly at 9 seconds in sound
    setTimeout(() => setBombPhase("explode"), 9000);
    setTimeout(() => {
      setBombPhase("done");
      // Only broadcast to other tabs/users if this is a real bomb (not a test)
      if (!testOnly) {
        channelRef.current?.postMessage({ type: "bomb", country });
      }
      confetti({
        particleCount: 120,
        angle: 90,
        spread: 360,
        origin: { x: 0.65, y: 0.5 },
        colors: ["#ef4444", "#f97316", "#fbbf24", "#111"],
        gravity: 1.2,
        scalar: 1.2,
      });
      // Clear "Target Eliminated" after sound ends (14s total, done starts at 9.5s = 4.5s remaining)
      setTimeout(() => {
        setBombPhase("idle");
        setAnimatingCountry(null);
        setIsTestBomb(false);
        animationInProgress.current = false;
      }, 4500);
    }, 9500);
  };

  // Process remote bomb animations from other users
  useEffect(() => {
    if (pendingAnimations.length > 0 && !animationInProgress.current && bombPhase === "idle") {
      const event = consumeAnimation();
      if (event) {
        triggerBomb(event.country, event.centroid, true);
      }
    }
  }, [pendingAnimations, bombPhase]);

  // When this user convinces Netanyahu — bomb locally + report to server
  useEffect(() => {
    if (isConvinced && selectedCountry) {
      triggerBomb(selectedCountry, targetCentroid, false);
      reportBomb(selectedCountry, targetCentroid, publicKey?.toBase58() || null);

      // Achievement tracking for bombs
      const newBombCount = bombedCountries.size + 1;
      unlockAchievement("first_blood");
      if (newBombCount >= 3) unlockAchievement("serial_bomber");
      if (newBombCount >= 5) unlockAchievement("strategist");
      if (newBombCount >= 10) unlockAchievement("world_domination");

      setTransferStatus(`Claiming 1.00 SOL reward...`);
      setTimeout(() => {
        setTransferStatus(`1.00 SOL reward claimed!`);
        setTimeout(() => setTransferStatus(null), 5000);
      }, 3500);
    }
  }, [isConvinced, selectedCountry, targetCentroid, lastReward]);

  const handleHoverCountry = useCallback((country: string | null, position: { x: number; y: number } | null) => {
    setHoveredCountry(country);
    setTooltipPos(position);
  }, []);

  return (
    <div className="flex h-screen w-full bg-[hsl(220,30%,6%)] text-white overflow-hidden relative">

      {/* Subtle Star of David watermark */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 200 200" className="w-[600px] h-[600px] animate-star-pulse" fill="none" stroke="hsl(217,89%,51%)" strokeWidth="0.5">
          <polygon points="100,30 130,90 70,90" />
          <polygon points="100,170 70,110 130,110" />
        </svg>
      </div>

      {/* Left Panel: Chat */}
      <div className="w-[380px] min-w-[380px] h-full border-r border-blue-900/30 flex flex-col bg-[hsl(220,30%,8%)]/90 backdrop-blur-sm z-10">
        {/* Header with Bibi */}
        <div className="p-4 border-b border-blue-900/30 flex items-center gap-3">
          <img
            src={bibiImage}
            alt="Netanyahu"
            className="w-11 h-11 rounded-full border-2 border-blue-500 shadow-lg shadow-blue-500/20"
          />
          <div className="flex-1">
            <h1 className="text-lg font-bold tracking-tight text-white">Netanyahu AI</h1>
            <p className="text-[11px] text-blue-400/70 font-mono">Prime Minister of Israel</p>
          </div>
          <WalletConnect />
        </div>
        <ChatComponent
          selectedCountry={selectedCountry}
          onConvinced={() => setIsConvinced(true)}
          onRewardClaimed={handleRewardClaimed}
          bombedCountries={bombedCountries}
          difficulty={difficulty}
          onChangeDifficulty={setDifficulty}
        />
      </div>

      {/* Right Panel: Map */}
      <div className="flex-1 h-full relative p-3">
        <MapComponent
          selectedCountry={selectedCountry}
          onSelectCountry={(name, centroid) => {
            if (bombedCountries.has(name)) return;
            setSelectedCountry(name);
            setTargetCentroid(centroid);
            setIsConvinced(false);
            setBombPhase("idle");
          }}
          isConvinced={isConvinced}
          bombPhase={bombPhase}
          bombedCountries={bombedCountries}
          isTestBomb={isTestBomb}
          onHoverCountry={handleHoverCountry}
        />

        {/* ===== PRIZE POOL — big visible panel ===== */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2">
          <div className="bg-black/80 backdrop-blur-md border border-amber-500/40 rounded-xl px-8 py-3 shadow-2xl shadow-amber-500/10 flex items-center gap-4 pointer-events-none">
            <div className="text-amber-500 text-2xl">🏆</div>
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-[0.2em] text-amber-400/60 font-mono">Prize Pool</div>
              <div className="text-2xl font-black text-amber-400 font-mono tabular-nums">{prizePool.toFixed(2)} SOL</div>
            </div>
            <div className="text-amber-500 text-2xl">🏆</div>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <button
              onClick={() => setShowLeaderboard(true)}
              className="bg-black/70 backdrop-blur-md border border-blue-900/40 text-blue-300 text-[11px] font-mono px-3 py-1.5 rounded-lg hover:border-blue-500/50 hover:text-blue-200 transition-all cursor-pointer"
            >
              🏆 Leaderboard
            </button>
            <button
              onClick={() => setShowAchievements(true)}
              className="bg-black/70 backdrop-blur-md border border-blue-900/40 text-blue-300 text-[11px] font-mono px-3 py-1.5 rounded-lg hover:border-blue-500/50 hover:text-blue-200 transition-all cursor-pointer"
            >
              🎖 Achievements
            </button>
            <button
              onClick={() => setShowGlobalStats(true)}
              className="bg-black/70 backdrop-blur-md border border-blue-900/40 text-blue-300 text-[11px] font-mono px-3 py-1.5 rounded-lg hover:border-blue-500/50 hover:text-blue-200 transition-all cursor-pointer"
            >
              📊 Intel
            </button>
            <button
              onClick={() => setShowDailyChallenge(true)}
              className="bg-black/70 backdrop-blur-md border border-amber-900/40 text-amber-300 text-[11px] font-mono px-3 py-1.5 rounded-lg hover:border-amber-500/50 hover:text-amber-200 transition-all cursor-pointer"
            >
              📅 Daily
            </button>
            <button
              onClick={() => setShowHowItWorks(true)}
              className="bg-black/70 backdrop-blur-md border border-blue-900/40 text-blue-300 text-[11px] font-mono px-3 py-1.5 rounded-lg hover:border-blue-500/50 hover:text-blue-200 transition-all cursor-pointer"
            >
              ❓ How It Works
            </button>
          </div>
        </div>




        {bombPhase === "done" && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center flex-col gap-3">
            <div className={`text-3xl font-black animate-pulse bg-black/70 px-8 py-4 rounded-xl border backdrop-blur-sm shadow-2xl uppercase tracking-widest ${isTestBomb ? "text-amber-400 border-amber-900/50" : "text-red-500 border-red-900/50"}`}>
              {isTestBomb ? "Test Preview" : "Target Eliminated"}
            </div>
            {(animatingCountry || selectedCountry) && (
              <div className="text-sm font-mono text-red-400/80 bg-black/50 px-4 py-1.5 rounded-lg">
                {isTestBomb ? `${animatingCountry || selectedCountry} — preview only` : `${animatingCountry || selectedCountry} has been bombed`}
              </div>
            )}
          </div>
        )}

        {/* Transfer Status Toast */}
        {transferStatus && (
          <div className="absolute bottom-6 right-6 bg-[hsl(220,30%,9%)] border border-blue-900/40 text-blue-100 px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 z-20">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-mono text-xs">{transferStatus}</span>
          </div>
        )}

        {/* Top-right country badge + test bomb button */}
        {selectedCountry && bombPhase === "idle" && (
          <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-20">
            <div className="bg-amber-600/20 border border-amber-500/40 text-amber-200 px-4 py-2 rounded-lg backdrop-blur-sm">
              <span className="text-[10px] uppercase tracking-widest text-amber-400 block">⚠ Target Selected</span>
              <span className="text-base font-bold">{selectedCountry}</span>
            </div>
            {!PROTECTED_ALLIES.has(selectedCountry) && (
              <button
                onClick={() => { triggerBomb(selectedCountry, targetCentroid, false, true); unlockAchievement("test_pilot"); }}
                className="bg-red-600/80 hover:bg-red-600 text-white text-[11px] font-bold px-4 py-2 rounded-lg border border-red-500/50 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-900/30 cursor-pointer"
              >
                💣 TEST BOMB
              </button>
            )}
          </div>
        )}

        {/* Bombed countries counter + streak + sound toggle */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 z-20">
          {bombedCountries.size > 0 && (
            <div className="bg-black/60 border border-red-900/30 text-red-400 px-3 py-1.5 rounded-lg backdrop-blur-sm">
              <span className="text-[10px] font-mono">Bombed: {bombedCountries.size} countr{bombedCountries.size === 1 ? "y" : "ies"}</span>
            </div>
          )}
          <StreakCounter />
          <SoundToggle />
        </div>

        {/* Live Activity Feed */}
        <ActivityFeed />
      </div>

      {/* Country Tooltip */}
      <CountryTooltip
        country={hoveredCountry}
        position={tooltipPos}
        isBombed={hoveredCountry ? bombedCountries.has(hoveredCountry) : false}
        isAlly={hoveredCountry ? PROTECTED_ALLIES.has(hoveredCountry) : false}
        isIsrael={hoveredCountry === "Israel"}
      />

      {/* Achievement Toast */}
      <AchievementToast />

      {/* Onboarding */}
      <Onboarding onComplete={() => {}} />

      {/* Modals */}
      <Leaderboard open={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      <HowItWorks open={showHowItWorks} onClose={() => setShowHowItWorks(false)} />
      <AchievementPanel open={showAchievements} onClose={() => setShowAchievements(false)} />
      <GlobalStats open={showGlobalStats} onClose={() => setShowGlobalStats(false)} bombedCount={bombedCountries.size} />
      <DailyChallenge
        open={showDailyChallenge}
        onClose={() => setShowDailyChallenge(false)}
        onSelectChallenge={(country) => {
          setSelectedCountry(country);
          setIsConvinced(false);
          setBombPhase("idle");
        }}
        bombedCountries={bombedCountries}
      />
    </div>
  );
}
