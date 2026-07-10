"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import ParticleBackground from "@/components/ParticleBackground";
import Navigation from "@/components/Navigation";
import ScoreRing from "@/components/ScoreRing";

interface ScoreData {
  nametag: string;
  score: number | null;
  completed: number;
  abandoned: number;
  total: number;
  latestTxId: string | null;
  explorerUrl: string | null;
  recentEvents: Array<{
    txId: string;
    outcome: string;
    walletA: string;
    walletB: string | null;
    detectedAt: string;
  }>;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScoreData | null>(null);
  const [error, setError] = useState("");

  const search = async (tag?: string) => {
    const q = (tag || query).trim().replace(/^@/, "").toLowerCase();
    if (!q) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/api/score/${encodeURIComponent(q)}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Failed to load score data");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") search();
  };

  const examples = ["alice", "bob", "trustedtrader", "testuser"];

  return (
    <div className="min-h-screen bg-black relative overflow-x-hidden">
      <ParticleBackground />
      <Navigation />

      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-28 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-orange-400 text-2xl font-mono">◈</span>
            <h1 className="text-3xl font-black gradient-text">Score Search</h1>
          </div>
          <p className="text-gray-500 font-mono text-sm">
            Look up any @nametag to see their trust score derived from real
            on-chain events
          </p>
        </motion.div>

        {/* Search box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 text-xl font-mono">
                @
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKey}
                placeholder="nametag or wallet address…"
                className="w-full bg-black/60 border border-gray-800 focus:border-orange-500/60 rounded-xl pl-10 pr-4 py-4 text-white font-mono text-base outline-none transition-colors placeholder-gray-700"
              />
            </div>
            <motion.button
              onClick={() => search()}
              disabled={loading || !query.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 bg-orange-500 hover:bg-orange-400 disabled:bg-gray-800 disabled:text-gray-600 text-black font-bold rounded-xl transition-colors glow-orange"
            >
              {loading ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  ◎
                </motion.span>
              ) : (
                "Search"
              )}
            </motion.button>
          </div>

          {/* Example tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-gray-600 text-xs font-mono">Try:</span>
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => {
                  setQuery(ex);
                  search(ex);
                }}
                className="text-xs font-mono text-orange-500/70 hover:text-orange-400 border border-orange-500/20 hover:border-orange-500/50 px-2 py-0.5 rounded transition-colors"
              >
                @{ex}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6"
          >
            <p className="text-red-400 font-mono text-sm">{error}</p>
          </motion.div>
        )}

        {/* Result */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={result.nametag}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Score card */}
              <div className="glass-card p-8 glow-border">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* Score ring */}
                  <div className="flex-shrink-0">
                    <ScoreRing score={result.score} size={180} />
                  </div>

                  {/* Details */}
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-orange-400 text-xs font-mono mb-1">
                      WALLET NAMETAG
                    </p>
                    <h2 className="text-3xl font-black text-white mb-4">
                      @{result.nametag}
                    </h2>

                    {!(result as any).hasConnected ? (
                      <div className="bg-black/40 rounded-xl p-4 border border-gray-800">
                        <p className="text-gray-500 font-mono text-sm">
                          This wallet has never connected to Trust Score Agent —
                          we have no on-chain history to score.
                        </p>
                      </div>
                    ) : result.total === 0 ? (
                      <div className="bg-black/40 rounded-xl p-4 border border-gray-800">
                        <p className="text-gray-500 font-mono text-sm">
                          Connected, but no trade events recorded yet.
                        </p>
                        <p className="text-orange-500/60 text-xs font-mono mt-2">
                          Scores appear after real on-chain activity is detected.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {[
                            {
                              label: "Completed",
                              value: result.completed,
                              color: "text-green-400",
                            },
                            {
                              label: "Abandoned",
                              value: result.abandoned,
                              color: "text-red-400",
                            },
                            {
                              label: "Total",
                              value: result.total,
                              color: "text-orange-400",
                            },
                          ].map((stat) => (
                            <div
                              key={stat.label}
                              className="bg-black/50 rounded-xl p-3 border border-gray-900 text-center"
                            >
                              <p
                                className={`text-2xl font-black counter-text ${stat.color}`}
                              >
                                {stat.value}
                              </p>
                              <p className="text-gray-600 text-xs font-mono">
                                {stat.label}
                              </p>
                            </div>
                          ))}
                        </div>

                        {result.latestTxId && (
                          <div className="bg-black/50 rounded-xl p-3 border border-orange-500/20">
                            <p className="text-gray-500 text-[10px] font-mono mb-1">
                              MOST RECENT TX (verify on-chain)
                            </p>
                            <div className="flex items-center gap-2">
                              <code className="text-orange-400 text-xs font-mono break-all flex-1">
                                {result.latestTxId.slice(0, 48)}…
                              </code>
                              {result.explorerUrl && (
                                <a
                                  href={result.explorerUrl}
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
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent events */}
              {result.recentEvents.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="text-orange-400 text-xs font-mono mb-4 tracking-widest">
                    RECENT TRADE EVENTS
                  </h3>
                  <div className="space-y-2">
                    {result.recentEvents.map((ev) => (
                      <motion.div
                        key={ev.txId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 bg-black/40 rounded-lg p-3 border border-gray-900 hover:border-orange-500/20 transition-colors"
                      >
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            ev.outcome === "completed"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {ev.outcome.toUpperCase()}
                        </span>
                        <code className="text-gray-500 text-xs font-mono flex-1 truncate">
                          {ev.txId}
                        </code>
                        <span className="text-gray-700 text-xs font-mono">
                          {new Date(ev.detectedAt).toLocaleTimeString()}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!loading && !result && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4 opacity-20">◈</div>
            <p className="text-gray-700 font-mono text-sm">
              Enter a @nametag to look up their trust score
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
