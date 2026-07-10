"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import ParticleBackground from "@/components/ParticleBackground";
import Navigation from "@/components/Navigation";
import ScoreRing from "@/components/ScoreRing";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import Link from "next/link";

interface ScoreData {
  nametag: string;
  score: number | null;
  completed: number;
  abandoned: number;
  total: number;
  latestTxId: string | null;
  explorerUrl: string | null;
  scoreHistory: Array<{ score: number; recordedAt: string; reasonTxId: string | null }>;
  recentEvents: Array<{
    txId: string;
    outcome: string;
    walletA: string;
    walletB: string | null;
    detectedAt: string;
  }>;
}

interface Identity {
  nametag?: string;
  directAddress?: string;
}

const sessionKey = "sphere-trust-session";

export default function MyScorePage() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(sessionKey);
    if (saved) {
      try {
        const parsed: Identity = JSON.parse(saved);
        setIdentity(parsed);
        const tag = parsed.nametag || parsed.directAddress || "";
        if (tag) {
          loadScore(tag);
          const interval = setInterval(() => loadScore(tag), 10000);
          return () => clearInterval(interval);
        }
      } catch {}
    }
  }, []);

  const loadScore = async (tag: string) => {
    setLoading(true);
    try {
      const q = tag.replace(/^@/, "").toLowerCase();
      const res = await fetch(`/api/score/${encodeURIComponent(q)}`);
      const data = await res.json();
      setScoreData(data);
    } catch {
      console.error("Failed to load score");
    } finally {
      setLoading(false);
    }
  };

  const chartData =
    scoreData?.scoreHistory
      .slice()
      .reverse()
      .map((h, i) => ({
        name: new Date(h.recordedAt).toLocaleTimeString("en", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        score: parseFloat(h.score as unknown as string),
        index: i,
      })) || [];

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-orange-500/30 rounded-lg p-3">
          <p className="text-gray-500 text-xs font-mono">{label}</p>
          <p className="text-orange-400 font-bold">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const getBadge = (score: number | null) => {
    if (score === null) return { label: "Unranked", color: "gray", icon: "◎" };
    if (score >= 90) return { label: "Elite", color: "green", icon: "◆" };
    if (score >= 75) return { label: "Trusted", color: "green", icon: "◈" };
    if (score >= 50) return { label: "Established", color: "orange", icon: "⬡" };
    if (score >= 25) return { label: "Developing", color: "yellow", icon: "◉" };
    return { label: "At Risk", color: "red", icon: "◌" };
  };

  const badge = getBadge(scoreData?.score ?? null);

  return (
    <div className="min-h-screen bg-black relative overflow-x-hidden">
      <ParticleBackground />
      <Navigation />

      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-28 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-orange-400 text-2xl font-mono">◎</span>
            <h1 className="text-3xl font-black gradient-text">My Score</h1>
          </div>
          <p className="text-gray-500 font-mono text-sm">
            Your real-time trust score computed from on-chain trade history
          </p>
        </motion.div>

        {/* Not connected */}
        <AnimatePresence>
          {!identity && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-card p-12 text-center glow-border"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="text-6xl mb-6"
              >
                ⬡
              </motion.div>
              <h2 className="text-white text-2xl font-bold mb-3">
                No Wallet Connected
              </h2>
              <p className="text-gray-500 font-mono text-sm mb-6">
                Connect your Sphere wallet to view your personal trust score
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-8 py-3 bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-xl transition-colors glow-orange"
              >
                ⬡ Connect Wallet
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connected — loading */}
        {identity && loading && (
          <div className="glass-card p-12 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="text-5xl text-orange-500 mb-4"
            >
              ◎
            </motion.div>
            <p className="text-gray-400 font-mono text-sm">
              Loading on-chain data…
            </p>
          </div>
        )}

        {/* Connected — data */}
        {identity && !loading && scoreData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Main score card */}
            <div className="glass-card p-8 glow-border">
              <div className="flex flex-col lg:flex-row items-center gap-10">
                {/* Score ring */}
                <div className="relative flex-shrink-0">
                  <ScoreRing score={scoreData.score} size={200} />
                  {/* Badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2 }}
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      background:
                        badge.color === "green"
                          ? "rgba(34,197,94,0.2)"
                          : badge.color === "orange"
                          ? "rgba(249,115,22,0.2)"
                          : "rgba(107,114,128,0.2)",
                      border: `1px solid ${
                        badge.color === "green"
                          ? "rgba(34,197,94,0.4)"
                          : badge.color === "orange"
                          ? "rgba(249,115,22,0.4)"
                          : "rgba(107,114,128,0.4)"
                      }`,
                      color:
                        badge.color === "green"
                          ? "#22c55e"
                          : badge.color === "orange"
                          ? "#f97316"
                          : "#9ca3af",
                    }}
                  >
                    {badge.icon} {badge.label}
                  </motion.div>
                </div>

                {/* Right side */}
                <div className="flex-1 w-full">
                  <p className="text-orange-400 text-xs font-mono mb-1">
                    YOUR WALLET
                  </p>
                  <h2 className="text-3xl font-black text-white mb-1">
                    {identity.nametag
                      ? `@${identity.nametag}`
                      : identity.directAddress?.slice(0, 20) + "…"}
                  </h2>
                  <p className="text-gray-600 text-xs font-mono mb-6">
                    Unicity Testnet2
                  </p>

                  {scoreData.total === 0 ? (
                    <div className="bg-black/40 rounded-xl p-5 border border-orange-500/20">
                      <p className="text-orange-400 font-mono text-sm font-bold mb-2">
                        ⬡ Wallet Registered
                      </p>
                      <p className="text-gray-500 text-sm">
                        Your wallet is now being monitored by the agent. Your
                        trust score will appear here after real trade activity is
                        detected on testnet2.
                      </p>
                      <p className="text-gray-600 text-xs font-mono mt-3">
                        Tip: Self-mint test UCT tokens and send them to another
                        wallet to generate your first trade event.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          label: "Completed",
                          value: scoreData.completed,
                          color: "#22c55e",
                          bg: "rgba(34,197,94,0.1)",
                        },
                        {
                          label: "Total Trades",
                          value: scoreData.total,
                          color: "#f97316",
                          bg: "rgba(249,115,22,0.1)",
                        },
                      ].map((stat) => (
                        <motion.div
                          key={stat.label}
                          className="rounded-xl p-4 border border-gray-900 text-center"
                          style={{ background: stat.bg }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <p
                            className="text-2xl font-black counter-text"
                            style={{ color: stat.color }}
                          >
                            {stat.value}
                          </p>
                          <p className="text-gray-600 text-xs font-mono">
                            {stat.label}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {scoreData.latestTxId && (
                    <div className="mt-4 bg-black/50 rounded-xl p-3 border border-orange-500/20">
                      <p className="text-gray-600 text-[10px] font-mono mb-1">
                        LATEST VERIFIED TX
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-orange-400 text-xs font-mono flex-1 truncate">
                          {scoreData.latestTxId}
                        </code>
                        {scoreData.explorerUrl && (
                          <a
                            href={scoreData.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-xs rounded border border-orange-500/30 transition-colors whitespace-nowrap"
                          >
                            Verify ↗
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Score History Chart */}
            {chartData.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-6"
              >
                <h3 className="text-orange-400 text-xs font-mono mb-6 tracking-widest">
                  SCORE HISTORY
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(249,115,22,0.05)"
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#374151"
                      tick={{ fill: "#374151", fontSize: 10, fontFamily: "monospace" }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="#374151"
                      tick={{ fill: "#374151", fontSize: 10, fontFamily: "monospace" }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#f97316"
                      strokeWidth={2}
                      fill="url(#scoreGrad)"
                      dot={{ fill: "#f97316", r: 3 }}
                      activeDot={{ r: 5, fill: "#fb923c" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Recent Events */}
            {scoreData.recentEvents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-6"
              >
                <h3 className="text-orange-400 text-xs font-mono mb-4 tracking-widest">
                  RECENT TRADE EVENTS
                </h3>
                <div className="space-y-2">
                  {scoreData.recentEvents.map((ev, i) => (
                    <motion.div
                      key={ev.txId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 bg-black/40 rounded-lg p-3 border border-gray-900"
                    >
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          ev.outcome === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {ev.outcome === "completed" ? "✓" : "✗"}{" "}
                        {ev.outcome.toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <code className="text-gray-500 text-xs font-mono truncate block">
                          {ev.txId}
                        </code>
                      </div>
                      <span className="text-gray-700 text-xs font-mono flex-shrink-0">
                        {new Date(ev.detectedAt).toLocaleTimeString()}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
