"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ScoreRingProps {
  score: number | null;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export default function ScoreRing({
  score,
  size = 180,
  strokeWidth = 12,
  label = "TRUST SCORE",
}: ScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeScore = score ?? 0;
  const offset = circumference - (safeScore / 100) * circumference;

  useEffect(() => {
    if (score === null) return;
    let start = 0;
    const end = score;
    const duration = 1200;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
      setDisplayScore(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [score]);

  const getColor = (s: number) => {
    if (s >= 75) return "#22c55e";
    if (s >= 40) return "#f97316";
    return "#ef4444";
  };

  const color = score === null ? "#374151" : getColor(safeScore);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg
        width={size}
        height={size}
        className="score-ring"
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(249,115,22,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Score ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
        {/* Pulse rings */}
        {score !== null && (
          <>
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={1}
              initial={{ opacity: 0.6, scale: 1 }}
              animate={{ opacity: 0, scale: 1.15 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
          </>
        )}
      </svg>
      {/* Center content */}
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{ transform: "none" }}
      >
        {score === null ? (
          <span className="text-gray-500 text-sm font-mono">N/A</span>
        ) : (
          <>
            <motion.span
              className="text-4xl font-black counter-text"
              style={{ color, textShadow: `0 0 20px ${color}` }}
            >
              {displayScore}
            </motion.span>
            <span className="text-xs text-gray-400 font-mono mt-0.5">/ 100</span>
          </>
        )}
        <span className="text-[9px] text-gray-500 font-mono tracking-[0.2em] mt-1 uppercase">
          {label}
        </span>
      </div>
    </div>
  );
}
