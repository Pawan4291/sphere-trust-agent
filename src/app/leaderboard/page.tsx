"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import ParticleBackground from "@/components/ParticleBackground";
import Navigation from "@/components/Navigation";
import ScoreRing from "@/components/ScoreRing";

interface LeaderboardEntry {
  wallet: string;
  score: number;
  completed: number;
  abandoned: number;
  recordedAt: string;
  reasonTxId: string | null;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      setEntries(data.leaderboard || []);
      setLastUpdated(new Date());
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 75) return "#22c55e";
    if (score >= 40) return "#f97316";
    return "#ef4444";
  };

  const getRankIcon = (i: number) => {
    if (i === 0) return "◆";
    if (i === 1) return "◈";
    if (i === 2) return "⬡";
    return `${i + 1}`;
  };

  const getRankStyle = (i: number) => {
    if (i === 0) return { color: "#f97316", glow: true };
    if (i === 1) return { color: "#9ca3af", glow: false };
    if (i === 2) return { color: "#b45309", glow: false };
    return { color: "#374151", glow: false };
  };

  return (
    <div className="min-h-screen bg-black relative overflow-x-hidden">
      <ParticleBackground />
      <Navigation />

      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-28 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-orange-400 text-2xl font-mono">◆</span>
                <h1 className="text-3xl font-black gradient-text">
                  Leaderboard
                </h1>
              </div>
              <p className="text-gray-500 font-mono text-sm">
                Ranked by trust score — all values from real on-chain data
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <div className="live-dot" />
                <span className="text-orange-400 text-xs font-mono">
                  AUTO-UPDATES
                </span>
              </div>
              {lastUpdated && (
                <p className="text-gray-700 text-[10px] font-mono mt-1">
                  {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Top 3 podium */}
        {entries.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-3 gap-3 mb-6"
          >
            {[entries[1], entries[0], entries[2]].map((entry, podiumIdx) => {
              const realIdx = podiumIdx === 0 ? 1 : podiumIdx === 1 ? 0 : 2;
              if (!entry) return null;
              const heights = ["h-28", "h-36", "h-24"];
              return (
                <motion.div
                  key={entry.wallet}
                  className="glass-card p-4 text-center flex flex-col items-center justify-end"
                  style={{
                    borderColor:
                      realIdx === 0
                        ? "rgba(249,115,22,0.4)"
                        : "rgba(249,115,22,0.1)",
                  }}
                  whileHover={{ y: -4 }}
                >
                  <div className={`flex items-end ${heights[podiumIdx]}`}>
                    <div className="w-full">
                      <ScoreRing
                        score={entry.score}
                        size={realIdx === 0 ? 100 : 80}
                        strokeWidth={8}
                        label=""
                      />
                    </div>
                  </div>
                  <p
                    className="text-lg font-black mt-2"
                    style={{ color: getRankStyle(realIdx).color }}
                  >
                    {getRankIcon(realIdx)}
                  </p>
                  <p className="text-white text-xs font-mono mt-1 truncate w-full">
                    {entry.wallet.replace(/^@/, "").slice(0, 12)}
                  </p>
                  <p className="text-gray-600 text-[10px] font-mono">
                    {entry.completed}W / {entry.abandoned}L
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Full table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card overflow-hidden"
        >
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-6 py-3 border-b border-gray-900">
            <div className="col-span-1 text-gray-600 text-xs font-mono">#</div>
            <div className="col-span-4 text-gray-600 text-xs font-mono">
              WALLET
            </div>
            <div className="col-span-2 text-gray-600 text-xs font-mono text-center">
              SCORE
            </div>
            <div className="col-span-2 text-gray-600 text-xs font-mono text-center">
              COMPLETED
            </div>
            <div className="col-span-2 text-gray-600 text-xs font-mono text-center">
              ABANDONED
            </div>
            <div className="col-span-1 text-gray-600 text-xs font-mono text-right">
              TX
            </div>
          </div>

          {loading && (
            <div className="py-16 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="text-4xl text-orange-500 mb-3"
              >
                ◎
              </motion.div>
              <p className="text-gray-600 font-mono text-sm">
                Loading leaderboard…
              </p>
            </div>
          )}

          {!loading && entries.length === 0 && (
            <div className="py-20 text-center">
              <div className="text-5xl mb-4 opacity-10">◆</div>
              <p className="text-gray-600 font-mono text-sm mb-2">
                No ranked wallets yet
              </p>
              <p className="text-gray-700 font-mono text-xs">
                The agent is watching for real trade events on testnet2.
                <br />
                Search a nametag or connect your wallet to get started.
              </p>
            </div>
          )}

          <AnimatePresence>
            {entries.map((entry, i) => {
              const color = getScoreColor(entry.score);
              const rank = getRankStyle(i);
              return (
                <motion.div
                  key={entry.wallet}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="grid grid-cols-12 gap-2 px-6 py-4 border-b border-gray-950 hover:bg-orange-500/5 transition-colors group"
                >
                  {/* Rank */}
                  <div className="col-span-1 flex items-center">
                    <span
                      className="font-bold text-sm"
                      style={{
                        color: rank.color,
                        textShadow: rank.glow
                          ? "0 0 10px rgba(249,115,22,0.8)"
                          : "none",
                      }}
                    >
                      {getRankIcon(i)}
                    </span>
                  </div>

                  {/* Wallet */}
                  <div className="col-span-4 flex items-center">
                    <div>
                      <p className="text-white text-sm font-mono truncate">
                        {entry.wallet.length > 20
                          ? entry.wallet.slice(0, 20) + "…"
                          : entry.wallet}
                      </p>
                      <p className="text-gray-700 text-[10px] font-mono">
                        {new Date(entry.recordedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="col-span-2 flex items-center justify-center">
                    <div className="text-center">
                      <span
                        className="text-xl font-black counter-text"
                        style={{
                          color,
                          textShadow: `0 0 10px ${color}50`,
                        }}
                      >
                        {entry.score}
                      </span>
                      <span className="text-gray-600 text-xs">/100</span>
                    </div>
                  </div>

                  {/* Completed */}
                  <div className="col-span-2 flex items-center justify-center">
                    <span className="text-green-400 font-mono text-sm font-bold">
                      {entry.completed}
                    </span>
                  </div>

                  {/* Abandoned */}
                  <div className="col-span-2 flex items-center justify-center">
                    <span className="text-red-400 font-mono text-sm">
                      {entry.abandoned}
                    </span>
                  </div>

                  {/* TX Link */}
                  <div className="col-span-1 flex items-center justify-end">
                    {entry.reasonTxId ? (
                      <a
                        href={`https://explorer.testnet2.unicity.network/tx/${entry.reasonTxId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-500/50 hover:text-orange-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        title={entry.reasonTxId}
                      >
                        ↗
                      </a>
                    ) : (
                      <span className="text-gray-800 text-xs">—</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {entries.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-gray-700 text-xs font-mono mt-4"
          >
            {entries.length} wallets ranked • All scores derived from real
            testnet2 on-chain events
          </motion.p>
        )}
      </div>
    </div>
  );
}
