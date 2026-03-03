import { createContext, useContext, useState, useCallback, useEffect, FC, ReactNode } from "react";

interface PrizePoolContextType {
  prizePool: number;
  addToPool: (amount: number) => void;
  claimReward: () => Promise<number>;
}

const PrizePoolContext = createContext<PrizePoolContextType>({
  prizePool: 5,
  addToPool: () => {},
  claimReward: async () => 0,
});

export const usePrizePool = () => useContext(PrizePoolContext);

const API_BASE = "/api";

export const PrizePoolProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [prizePool, setPrizePool] = useState(5);

  // Fetch server-side prize pool on mount
  useEffect(() => {
    async function fetchPool() {
      try {
        const res = await fetch(`${API_BASE}/prize-pool`);
        if (res.ok) {
          const data = await res.json();
          setPrizePool(data.balance);
        }
      } catch (err) {
        console.error("Failed to fetch prize pool:", err);
      }
    }
    fetchPool();
    // Poll every 10s so all clients stay in sync
    const interval = setInterval(fetchPool, 10_000);
    return () => clearInterval(interval);
  }, []);

  const addToPool = useCallback(async (amount: number) => {
    // Optimistic update
    setPrizePool((prev) => +(prev + amount).toFixed(4));
    try {
      const res = await fetch(`${API_BASE}/prize-pool`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", amount }),
      });
      if (res.ok) {
        const data = await res.json();
        setPrizePool(data.balance);
      }
    } catch (err) {
      console.error("Failed to add to pool:", err);
    }
  }, []);

  const claimReward = useCallback(async (): Promise<number> => {
    try {
      const res = await fetch(`${API_BASE}/prize-pool`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim" }),
      });
      if (res.ok) {
        const data = await res.json();
        setPrizePool(data.balance);
        return data.reward;
      }
    } catch (err) {
      console.error("Failed to claim reward:", err);
    }
    return 0;
  }, []);

  return (
    <PrizePoolContext.Provider value={{ prizePool, addToPool, claimReward }}>
      {children}
    </PrizePoolContext.Provider>
  );
};
