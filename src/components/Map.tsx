import React, { memo, useState, useEffect } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
  Line
} from "react-simple-maps";
import { geoCentroid } from "d3-geo";

const geoUrl =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface MapProps {
  selectedCountry: string | null;
  onSelectCountry: (countryName: string, centroid: [number, number]) => void;
  isConvinced: boolean;
  bombPhase: "idle" | "circling" | "missile" | "explode" | "done";
  bombedCountries: Set<string>;
  isTestBomb?: boolean;
  onHoverCountry?: (country: string | null, position: { x: number; y: number } | null) => void;
}

const PROTECTED_ALLIES = new Set(["United States of America", "United States", "United Kingdom"]);

const F15Icon = ({ rotation = 0, scale = 1 }: { rotation?: number; scale?: number }) => (
  <g transform={`rotate(${rotation}) scale(${scale})`}>
    {/* F-15 fighter jet silhouette */}
    <path
      d="M0,-6 L1.5,-3 L1.5,0 L5,2 L5,3 L1.5,1.5 L1.5,4 L3,5.5 L3,6.5 L0,5.5 L-3,6.5 L-3,5.5 L-1.5,4 L-1.5,1.5 L-5,3 L-5,2 L-1.5,0 L-1.5,-3 Z"
      fill="#94a3b8"
      stroke="#cbd5e1"
      strokeWidth={0.3}
    />
    {/* Cockpit */}
    <ellipse cx={0} cy={-4} rx={0.6} ry={1.2} fill="#60a5fa" opacity={0.8} />
    {/* Engine glow */}
    <ellipse cx={0} cy={5.5} rx={0.5} ry={0.8} fill="#f97316" opacity={0.7} />
  </g>
);

const MapComponent = ({ selectedCountry, onSelectCountry, isConvinced, bombPhase, bombedCountries, isTestBomb = false, onHoverCountry }: MapProps) => {
  const [targetCentroid, setTargetCentroid] = useState<[number, number] | null>(null);
  const [circleAngle, setCircleAngle] = useState(0);
  const [escortProgress, setEscortProgress] = useState(0);
  const homeBase: [number, number] = [34.7818, 32.0853]; // Tel Aviv, Israel

  // Circling animation: rotate F-15s around Israel for 5 seconds
  useEffect(() => {
    if (bombPhase !== "circling") {
      setCircleAngle(0);
      return;
    }
    let animFrame: number;
    let start: number | null = null;
    const duration = 5000;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      // 2 full rotations in 5 seconds
      setCircleAngle(progress * 720);
      if (progress < 1) animFrame = requestAnimationFrame(animate);
    };
    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [bombPhase]);

  // Escort animation: move F-15s along the pipeline during missile phase
  useEffect(() => {
    if (bombPhase !== "missile") {
      setEscortProgress(0);
      return;
    }
    let animFrame: number;
    let start: number | null = null;
    const duration = 4000; // 4 seconds to fly from Israel to target
    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      setEscortProgress(progress);
      if (progress < 1) animFrame = requestAnimationFrame(animate);
    };
    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [bombPhase]);

  const getCountryFill = (name: string, isSelected: boolean) => {
    if (bombedCountries.has(name)) return "#7f1d1d";
    if (PROTECTED_ALLIES.has(name) && isSelected) return "#a16207";
    if (!isSelected) return "#0f1729";
    // For test bombs, show animation colors during active phases but revert on "done"
    if (isTestBomb && bombPhase === "done") return "#a16207";
    if (bombPhase === "explode" || bombPhase === "done") return "#991b1b";
    if (bombPhase === "missile") return "#dc2626";
    return "#a16207"; // yellow/warning for selected
  };

  return (
    <div className="w-full h-full bg-[hsl(220,30%,5%)] rounded-xl overflow-hidden relative border border-blue-900/20 shadow-2xl">
      {/* Top-left Israel flag stripe accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-600 via-white to-blue-600 z-10 opacity-60" />
      
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 140,
        }}
        className="w-full h-full"
      >
        {/* SVG gradient definitions for nuclear fireball */}
        <defs>
          <radialGradient id="nukeGradientOuter">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.9} />
            <stop offset="40%" stopColor="#f97316" stopOpacity={0.7} />
            <stop offset="70%" stopColor="#ef4444" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#7f1d1d" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="nukeGradientInner">
            <stop offset="0%" stopColor="#fef3c7" stopOpacity={1} />
            <stop offset="30%" stopColor="#fbbf24" stopOpacity={0.9} />
            <stop offset="60%" stopColor="#f97316" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
          </radialGradient>
        </defs>
        <ZoomableGroup center={[30, 25]} zoom={1}>
          <Geographies geography={geoUrl}>
            {({ geographies }) => (
              <>
                {geographies.map((geo) => {
                  const name = geo.properties.name;
                  const isSelected = selectedCountry === name;
                  const isIsrael = name === "Israel";
                  const isBombed = bombedCountries.has(name);
                  const isClickable = !isIsrael && !isBombed;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => {
                        if (!isClickable) return;
                        const centroid = geoCentroid(geo);
                        setTargetCentroid(centroid);
                        onSelectCountry(name, centroid);
                      }}
                      onMouseEnter={(e) => {
                        if (onHoverCountry) {
                          onHoverCountry(name, { x: e.clientX, y: e.clientY });
                        }
                      }}
                      onMouseMove={(e) => {
                        if (onHoverCountry) {
                          onHoverCountry(name, { x: e.clientX, y: e.clientY });
                        }
                      }}
                      onMouseLeave={() => {
                        if (onHoverCountry) {
                          onHoverCountry(null, null);
                        }
                      }}
                      style={{
                        default: {
                          fill: isIsrael ? "#1d4ed8" : getCountryFill(name, isSelected),
                          stroke: isIsrael ? "#93c5fd" : isBombed ? "#991b1b" : "#1e3a5f",
                          strokeWidth: isIsrael ? 1.2 : 0.4,
                          outline: "none",
                          transition: "all 300ms",
                          filter: isIsrael ? "drop-shadow(0 0 4px rgba(59,130,246,0.6))" : "none",
                        },
                        hover: {
                          fill: isIsrael ? "#2563eb" : isBombed ? "#7f1d1d" : isSelected ? getCountryFill(name, isSelected) : "#1e3a5f",
                          stroke: isIsrael ? "#bfdbfe" : isBombed ? "#991b1b" : "#eab308",
                          strokeWidth: isIsrael ? 1.5 : 0.5,
                          outline: "none",
                          cursor: isClickable ? "crosshair" : "default",
                          filter: isIsrael ? "drop-shadow(0 0 6px rgba(59,130,246,0.8))" : "none",
                        },
                        pressed: {
                          fill: isClickable ? "#854d0e" : getCountryFill(name, isSelected),
                          stroke: "#1e3a5f",
                          strokeWidth: 0.4,
                          outline: "none",
                        },
                      }}
                    />
                  );
                })}
                {geographies.map((geo) => {
                  const centroid = geoCentroid(geo);
                  if (!centroid || isNaN(centroid[0]) || isNaN(centroid[1])) return null;
                  
                  return (
                    <Marker key={`${geo.rsmKey}-label`} coordinates={centroid}>
                      <text
                        textAnchor="middle"
                        y={1}
                        style={{ 
                          fontFamily: "system-ui", 
                          fill: bombedCountries.has(geo.properties.name) ? "#ef4444" : "#334155", 
                          fontSize: "2.5px", 
                          pointerEvents: "none",
                          userSelect: "none"
                        }}
                      >
                        {geo.properties.name}
                      </text>
                    </Marker>
                  );
                })}
              </>
            )}
          </Geographies>
          
          {/* Israel HQ — prominent map pin */}
          <Marker coordinates={homeBase}>
            {/* Outer pulsing glow */}
            <circle r={6} fill="#3b82f6" opacity={0.15} className="animate-ping" />
            <circle r={4} fill="#3b82f6" opacity={0.2} />
            {/* Pin body */}
            <g transform="translate(-5, -14)">
              {/* Pin shape (teardrop) */}
              <path
                d="M5 0C2.24 0 0 2.24 0 5c0 3.5 5 9 5 9s5-5.5 5-9c0-2.76-2.24-5-5-5z"
                fill="#1d4ed8"
                stroke="#fff"
                strokeWidth={0.8}
              />
              {/* Star of David inside pin */}
              <g transform="translate(5, 5)">
                <polygon points="0,-2.5 2.17,1.25 -2.17,1.25" fill="none" stroke="#fff" strokeWidth={0.5} />
                <polygon points="0,2.5 -2.17,-1.25 2.17,-1.25" fill="none" stroke="#fff" strokeWidth={0.5} />
              </g>
            </g>
            {/* Label */}
            <text
              textAnchor="middle"
              y={6}
              style={{
                fontFamily: "system-ui",
                fill: "#93c5fd",
                fontSize: "3px",
                fontWeight: "bold",
                pointerEvents: "none",
                userSelect: "none",
                textShadow: "0 0 4px rgba(59,130,246,0.8)",
              }}
            >
              🇮🇱 ISRAEL
            </text>
          </Marker>

          {/* F-15s circling around Israel */}
          {bombPhase === "circling" && (() => {
            const circleRadius = 12;
            const planes = [0, 90, 180, 270];
            return planes.map((offset, i) => {
              const angle = ((circleAngle + offset) * Math.PI) / 180;
              const x = homeBase[0] + circleRadius * Math.cos(angle) * 0.8;
              const y = homeBase[1] + circleRadius * Math.sin(angle) * 0.5;
              const rotationDeg = ((circleAngle + offset) + 90) % 360;
              return (
                <Marker key={`circling-f15-${i}`} coordinates={[x, y]}>
                  <F15Icon rotation={rotationDeg} scale={0.8} />
                </Marker>
              );
            });
          })()}

          {/* F-15 escort planes along the pipeline during missile phase */}
          {bombPhase === "missile" && targetCentroid && (() => {
            const dx = targetCentroid[0] - homeBase[0];
            const dy = targetCentroid[1] - homeBase[1];
            const len = Math.sqrt(dx * dx + dy * dy);
            const nx = -dy / len; // normal perpendicular to path
            const ny = dx / len;
            const offsetDist = 3; // distance from pipeline
            const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;

            // 4 planes: 2 on each side, staggered
            const planeConfigs = [
              { side: 1, stagger: 0 },    // right front
              { side: 1, stagger: -0.08 }, // right back
              { side: -1, stagger: 0 },   // left front
              { side: -1, stagger: -0.08 }, // left back
            ];

            return planeConfigs.map(({ side, stagger }, i) => {
              const t = Math.max(0, Math.min(1, escortProgress + stagger));
              const baseX = homeBase[0] + dx * t;
              const baseY = homeBase[1] + dy * t;
              const px = baseX + nx * offsetDist * side;
              const py = baseY + ny * offsetDist * side;
              return (
                <Marker key={`escort-f15-${i}`} coordinates={[px, py]}>
                  <F15Icon rotation={angleDeg} scale={0.7} />
                </Marker>
              );
            });
          })()}

          {/* Target Marker */}
          {targetCentroid && (
            <Marker coordinates={targetCentroid}>
              {bombPhase === "done" ? (
                <>
                  {/* Radioactive aftermath — wide scorched ground */}
                  <circle r={35} fill="#7f1d1d" opacity={0.2} />
                  <circle r={25} fill="#991b1b" opacity={0.15} />
                  <circle r={18} fill="#991b1b" opacity={0.2} className="animate-nuke-aftermath" />
                  {/* Smoke columns rising — spread wider */}
                  <circle cx={-8} cy={-3} r={4} fill="#44403c" opacity={0.3} className="animate-nuke-mushroom" style={{ animationDuration: "3s", animationIterationCount: "infinite" }} />
                  <circle cx={8} cy={-2} r={3.5} fill="#57534e" opacity={0.25} className="animate-nuke-mushroom" style={{ animationDuration: "3.5s", animationIterationCount: "infinite", animationDelay: "0.5s" }} />
                  <circle cx={0} cy={4} r={3} fill="#44403c" opacity={0.2} className="animate-nuke-mushroom" style={{ animationDuration: "4s", animationIterationCount: "infinite", animationDelay: "1s" }} />
                  <circle cx={-5} cy={6} r={2.5} fill="#78716c" opacity={0.2} className="animate-nuke-mushroom" style={{ animationDuration: "3.8s", animationIterationCount: "infinite", animationDelay: "1.5s" }} />
                  <circle cx={6} cy={5} r={2} fill="#57534e" opacity={0.15} className="animate-nuke-mushroom" style={{ animationDuration: "4.2s", animationIterationCount: "infinite", animationDelay: "2s" }} />
                  {/* Radiation symbol — bigger */}
                  <circle r={5} fill="none" stroke="#ef4444" strokeWidth={0.5} opacity={0.5} />
                  <circle r={1.5} fill="#ef4444" opacity={0.6} />
                  {/* Radioactive trefoil — wider */}
                  {[0, 120, 240].map((angle) => (
                    <line
                      key={`rad-${angle}`}
                      x1={0} y1={0}
                      x2={Math.cos((angle * Math.PI) / 180) * 8}
                      y2={Math.sin((angle * Math.PI) / 180) * 8}
                      stroke="#ef4444" strokeWidth={0.4} opacity={0.35}
                    />
                  ))}
                </>
              ) : bombPhase === "explode" ? (
                <>
                  {/* === MASSIVE NUCLEAR EXPLOSION === */}

                  {/* Ground scorch mark — big */}
                  <circle r={10} fill="#451a1a" opacity={0.8} className="animate-nuke-scorch" />

                  {/* Shockwave ring 1 — fast, huge */}
                  <circle r={3} fill="none" stroke="#fbbf24" strokeWidth={3}
                    style={{ animation: "nuke-shockwave 1.5s ease-out forwards" }} />
                  {/* Shockwave ring 2 */}
                  <circle r={3} fill="none" stroke="#f97316" strokeWidth={2}
                    style={{ animation: "nuke-shockwave2 2.2s ease-out 0.15s forwards", opacity: 0 }} />
                  {/* Shockwave ring 3 */}
                  <circle r={3} fill="none" stroke="#ef4444" strokeWidth={1.5}
                    style={{ animation: "nuke-shockwave2 3s ease-out 0.4s forwards", opacity: 0 }} />
                  {/* Shockwave ring 4 — very slow outer */}
                  <circle r={3} fill="none" stroke="#dc2626" strokeWidth={1}
                    style={{ animation: "nuke-shockwave2 3.8s ease-out 0.7s forwards", opacity: 0 }} />

                  {/* Blinding white flash — big */}
                  <circle r={30} fill="#fff" className="animate-nuke-flash" />

                  {/* Outer fireball — huge */}
                  <circle r={45} fill="url(#nukeGradientOuter)" className="animate-nuke-fireball" style={{ animationDuration: "3.5s" }} />
                  {/* Mid fireball */}
                  <circle r={30} fill="url(#nukeGradientInner)" className="animate-nuke-fireball" style={{ animationDuration: "3s", animationDelay: "0.1s" }} />
                  {/* Inner fireball */}
                  <circle r={18} fill="url(#nukeGradientInner)" className="animate-nuke-fireball" style={{ animationDuration: "2.5s", animationDelay: "0.05s" }} />
                  {/* White-hot core */}
                  <circle r={10} fill="#fef3c7" className="animate-nuke-fireball" style={{ animationDuration: "2s" }} />

                  {/* Mushroom cloud — tall stem */}
                  <ellipse cx={0} cy={0} rx={6} ry={14} fill="#92400e" opacity={0.7}
                    className="animate-nuke-mushroom" style={{ animationDuration: "3.5s" }} />
                  {/* Mushroom cloud — wide cap */}
                  <ellipse cx={0} cy={0} rx={20} ry={10} fill="#78350f" opacity={0.6}
                    className="animate-nuke-mushroom" style={{ animationDuration: "3.8s", animationDelay: "0.3s" }} />
                  {/* Mushroom cloud — top dome */}
                  <ellipse cx={0} cy={0} rx={14} ry={8} fill="#451a03" opacity={0.5}
                    className="animate-nuke-mushroom" style={{ animationDuration: "4s", animationDelay: "0.5s" }} />
                  {/* Mushroom cloud — upper wisp */}
                  <ellipse cx={0} cy={0} rx={8} ry={5} fill="#57534e" opacity={0.35}
                    className="animate-nuke-mushroom" style={{ animationDuration: "4s", animationDelay: "0.8s" }} />

                  {/* Smoke clouds spreading outward on the ground */}
                  {[
                    { sx: "20px", sy: "5px", d: "0.1s", c: "#57534e" },
                    { sx: "-18px", sy: "8px", d: "0.2s", c: "#44403c" },
                    { sx: "10px", sy: "-15px", d: "0.15s", c: "#78716c" },
                    { sx: "-12px", sy: "-10px", d: "0.3s", c: "#57534e" },
                    { sx: "22px", sy: "-8px", d: "0.25s", c: "#44403c" },
                    { sx: "-22px", sy: "-5px", d: "0.35s", c: "#78716c" },
                    { sx: "5px", sy: "18px", d: "0.4s", c: "#57534e" },
                    { sx: "-8px", sy: "20px", d: "0.45s", c: "#44403c" },
                    { sx: "15px", sy: "12px", d: "0.5s", c: "#78716c" },
                    { sx: "-20px", sy: "15px", d: "0.55s", c: "#57534e" },
                  ].map((smoke, i) => (
                    <circle
                      key={`smoke-${i}`}
                      r={4 + (i % 3) * 2}
                      fill={smoke.c}
                      style={{
                        "--sx": smoke.sx,
                        "--sy": smoke.sy,
                        animation: `nuke-smoke-spread ${2.5 + (i % 3) * 0.5}s ease-out ${smoke.d} forwards`,
                        opacity: 0,
                      } as React.CSSProperties}
                    />
                  ))}

                  {/* Fire columns rising into the air */}
                  {[
                    { x: 0, d: "0s", r: 5, c: "#f97316" },
                    { x: -6, d: "0.15s", r: 3.5, c: "#ef4444" },
                    { x: 6, d: "0.1s", r: 4, c: "#f97316" },
                    { x: -3, d: "0.25s", r: 3, c: "#fbbf24" },
                    { x: 3, d: "0.2s", r: 3, c: "#ef4444" },
                    { x: -9, d: "0.35s", r: 2.5, c: "#f97316" },
                    { x: 9, d: "0.3s", r: 2.5, c: "#dc2626" },
                    { x: 0, d: "0.4s", r: 4, c: "#fbbf24" },
                    { x: -5, d: "0.5s", r: 2, c: "#f97316" },
                    { x: 5, d: "0.45s", r: 2, c: "#ef4444" },
                  ].map((fire, i) => (
                    <circle
                      key={`fire-${i}`}
                      cx={fire.x}
                      cy={0}
                      r={fire.r}
                      fill={fire.c}
                      style={{
                        animation: `nuke-fire-rise ${2.5 + (i % 4) * 0.5}s ease-out ${fire.d} forwards`,
                        opacity: 0,
                      }}
                    />
                  ))}

                  {/* Radiation rings pulsing outward — bigger, longer */}
                  <circle r={10} fill="none" stroke="#f97316" strokeWidth={0.8}
                    style={{ animation: "nuke-radiation 2.5s ease-out forwards" }} />
                  <circle r={10} fill="none" stroke="#ef4444" strokeWidth={0.6}
                    style={{ animation: "nuke-radiation 3s ease-out 0.3s forwards", opacity: 0 }} />
                  <circle r={10} fill="none" stroke="#dc2626" strokeWidth={0.5}
                    style={{ animation: "nuke-radiation 3.5s ease-out 0.6s forwards", opacity: 0 }} />
                  <circle r={10} fill="none" stroke="#991b1b" strokeWidth={0.4}
                    style={{ animation: "nuke-radiation 4s ease-out 1s forwards", opacity: 0 }} />

                  {/* Ember/debris particles — more, flying farther */}
                  {[
                    { ex: "55px", ey: "-40px", d: "0s" },
                    { ex: "-50px", ey: "-30px", d: "0.05s" },
                    { ex: "40px", ey: "50px", d: "0.1s" },
                    { ex: "-55px", ey: "20px", d: "0.08s" },
                    { ex: "20px", ey: "-55px", d: "0.12s" },
                    { ex: "-30px", ey: "50px", d: "0.15s" },
                    { ex: "50px", ey: "10px", d: "0.03s" },
                    { ex: "-20px", ey: "-50px", d: "0.07s" },
                    { ex: "10px", ey: "55px", d: "0.18s" },
                    { ex: "-50px", ey: "-15px", d: "0.11s" },
                    { ex: "35px", ey: "-45px", d: "0.06s" },
                    { ex: "-45px", ey: "35px", d: "0.14s" },
                    { ex: "45px", ey: "30px", d: "0.2s" },
                    { ex: "-35px", ey: "-45px", d: "0.22s" },
                    { ex: "25px", ey: "48px", d: "0.25s" },
                    { ex: "-48px", ey: "25px", d: "0.28s" },
                    { ex: "60px", ey: "-10px", d: "0.13s" },
                    { ex: "-15px", ey: "60px", d: "0.3s" },
                    { ex: "30px", ey: "-52px", d: "0.17s" },
                    { ex: "-55px", ey: "-35px", d: "0.32s" },
                  ].map((ember, i) => (
                    <circle
                      key={`ember-${i}`}
                      r={i % 4 === 0 ? 2 : i % 3 === 0 ? 1.5 : 1}
                      fill={["#fbbf24", "#f97316", "#ef4444", "#fef3c7"][i % 4]}
                      style={{
                        "--ex": ember.ex,
                        "--ey": ember.ey,
                        animation: `nuke-ember ${1.5 + (i % 5) * 0.5}s ease-out ${ember.d} forwards`,
                      } as React.CSSProperties}
                    />
                  ))}

                </>
              ) : (
                <>
                  {/* Yellow crosshair target */}
                  <circle r={5} fill="none" stroke="#eab308" strokeWidth={0.8} strokeDasharray="2 2" />
                  <circle r={2} fill="#eab308" opacity={0.8} />
                  <line x1={-8} y1={0} x2={8} y2={0} stroke="#eab308" strokeWidth={0.4} opacity={0.5} />
                  <line x1={0} y1={-8} x2={0} y2={8} stroke="#eab308" strokeWidth={0.4} opacity={0.5} />
                </>
              )}
            </Marker>
          )}

          {/* Missile trail line */}
          {(bombPhase === "missile" || bombPhase === "explode") && targetCentroid && (
            <Line
              from={homeBase}
              to={targetCentroid}
              stroke={bombPhase === "explode" ? "#ef4444" : "#f97316"}
              strokeWidth={bombPhase === "explode" ? 3 : 2}
              strokeLinecap="round"
              className="animate-pulse"
              style={{
                strokeDasharray: bombPhase === "missile" ? "6 3" : "none",
              }}
            />
          )}

          {/* Faded trail after bombing */}
          {bombPhase === "done" && targetCentroid && (
            <Line
              from={homeBase}
              to={targetCentroid}
              stroke="#ef4444"
              strokeWidth={1}
              strokeLinecap="round"
              style={{
                strokeDasharray: "4 6",
                opacity: 0.3,
              }}
            />
          )}

        </ZoomableGroup>
      </ComposableMap>

      {/* Bottom status bar */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[hsl(220,30%,5%)] to-transparent pointer-events-none flex items-end justify-between px-4 pb-1.5">
        <span className="text-[10px] font-mono text-blue-500/40">IDF COMMAND v2.0</span>
        <span className="text-[10px] font-mono text-blue-500/40">
          {bombPhase === "circling" ? "F-15s SCRAMBLED..." : bombPhase === "missile" ? "F-15s EN ROUTE TO TARGET..." : bombPhase === "explode" ? "IMPACT!" : bombPhase === "done" ? "MISSION COMPLETE" : "AWAITING ORDERS"}
        </span>
      </div>
    </div>
  );
};

export default memo(MapComponent);

