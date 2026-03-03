import { useState, useEffect, useRef, useCallback } from "react";

const API_BASE = "/api";
const POLL_INTERVAL = 2000; // Poll every 2 seconds for new bomb events

interface BombEvent {
  country: string;
  centroid: [number, number] | null;
  timestamp: number;
}

interface BombSyncState {
  bombedCountries: Set<string>;
  pendingAnimations: BombEvent[];
  consumeAnimation: () => BombEvent | undefined;
  reportBomb: (country: string, centroid: [number, number] | null) => Promise<boolean>;
}

export function useBombSync(): BombSyncState {
  const [bombedCountries, setBombedCountries] = useState<Set<string>>(new Set());
  const [pendingAnimations, setPendingAnimations] = useState<BombEvent[]>([]);
  const lastEventTimestamp = useRef<number>(0);
  const localBombs = useRef<Set<string>>(new Set()); // bombs triggered by this client

  // Fetch initial bombed countries on mount
  useEffect(() => {
    async function fetchBombed() {
      try {
        const res = await fetch(`${API_BASE}/bombed`);
        if (res.ok) {
          const data = await res.json();
          const countries: string[] = data.countries || [];
          setBombedCountries(new Set(countries));
        }
      } catch (err) {
        console.error("Failed to fetch bombed countries:", err);
      }
    }
    fetchBombed();
  }, []);

  // Poll for new bomb events
  useEffect(() => {
    let active = true;

    async function pollEvents() {
      if (!active) return;
      try {
        const res = await fetch(
          `${API_BASE}/bomb-events?since=${lastEventTimestamp.current}`
        );
        if (res.ok) {
          const data = await res.json();
          const events: BombEvent[] = data.events || [];
          if (events.length > 0) {
            // Update last timestamp
            const maxTs = Math.max(...events.map((e) => e.timestamp));
            lastEventTimestamp.current = maxTs;

            // Add to bombed set
            setBombedCountries((prev) => {
              const next = new Set(prev);
              events.forEach((e) => next.add(e.country));
              return next;
            });

            // Queue animations for events NOT triggered by this client
            const remoteEvents = events.filter(
              (e) => !localBombs.current.has(e.country)
            );
            if (remoteEvents.length > 0) {
              setPendingAnimations((prev) => [...prev, ...remoteEvents]);
            }
          }
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    }

    const interval = setInterval(pollEvents, POLL_INTERVAL);
    // Initial poll
    pollEvents();

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Consume one animation from the queue (called by App after triggering animation)
  const consumeAnimation = useCallback((): BombEvent | undefined => {
    let consumed: BombEvent | undefined;
    setPendingAnimations((prev) => {
      if (prev.length === 0) return prev;
      consumed = prev[0];
      return prev.slice(1);
    });
    return consumed;
  }, []);

  // Report a bomb to the server (called when THIS user bombs a country)
  const reportBomb = useCallback(
    async (country: string, centroid: [number, number] | null): Promise<boolean> => {
      // Mark as local so we don't double-animate
      localBombs.current.add(country);
      // Optimistically add to set
      setBombedCountries((prev) => new Set(prev).add(country));

      try {
        const res = await fetch(`${API_BASE}/bomb`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country, centroid }),
        });
        if (!res.ok) {
          const data = await res.json();
          if (res.status === 409) {
            // Already bombed — no problem
            return true;
          }
          console.error("Bomb API error:", data);
          return false;
        }
        return true;
      } catch (err) {
        console.error("Failed to report bomb:", err);
        return false;
      }
    },
    []
  );

  return { bombedCountries, pendingAnimations, consumeAnimation, reportBomb };
}
