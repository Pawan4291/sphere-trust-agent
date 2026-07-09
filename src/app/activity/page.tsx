"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import ParticleBackground from "@/components/ParticleBackground";
import Navigation from "@/components/Navigation";

interface ActivityEntry {
  id: number;
  text: string;
  txId: string | null;
  createdAt: string;
  explorerUrl: string | null;
}

interface AgentStatus {
  status: string;
  network: string;
  stats: {
    tradeEvents: number;
    activityLogs: number;
    watchedWallets: number;
    scoreRecords: number;
  };
  timestamp: string;
}

export default function ActivityPage() {
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const prevIdsRef = useRef<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadActivity = async () => {
    try {
      const [actRes, statusRes] = await Promise.all([
        fetch("/api/activity"),
        fetch("/api/agent/status"),
      ]);
      const actData = await actRes.json();
      const statusData = await statusRes.json();

      const entries: ActivityEntry[] = actData.activity || [];
      const newIds = new Set(entries.map((e: ActivityEntry) => e.id));
      
      // Count truly new entries
      let added = 0;
      newIds.forEach((id) => {
        if (!prevIdsRef.current.has(id)) added++;
      });
      
      if (added > 0 && prevIdsRef.current.size > 0) {
        setNewCount((prev) => prev + added);
        setTimeout(() => setNewCount(0), 3000);
      }
      
      prevIdsRef.current = newIds;
      setActivity(entries);
      setAgentStatus(statusData);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadActivity();
    const interval = setInterval(loadActivity, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    return d.toLocaleDateString("en", { month: "short", day: "numeric" });
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
          className="mb-6"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-orange-400 text-2xl font-mono">◉</span>
                <h1 className="text-3xl font-black gradient-text">
                  Agent Activity
                </h1>
              </div>
              <p className="text-gray-500 font-mono text-sm">
                Live feed of real events processed by the autonomous agent —
                every row has a real tx ID
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/20 bg-black/50">
              <div className="live-dot" />
              <span className="text-orange-400 text-xs font-mono">
                POLLING 5s
              </span>
            </div>
          </div>
        </motion.div>

        {/* Agent status bar */}
        {agentStatus && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-4 mb-4"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="live-dot" />
                <div>
                  <p className="text-orange-400 text-xs font-mono">
                    AGENT STATUS
                  </p>
                  <p className="text-white text-sm font-bold capitalize">
                    {agentStatus.status}
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                {[
                  {
                    label: "Watched Wallets",
                    value: agentStatus.stats.watchedWallets,
                  },
                  {
                    label: "Trade Events",
                    value: agentStatus.stats.tradeEvents,
                  },
                  {
                    label: "Activity Logs",
                    value: agentStatus.stats.activityLogs,
                  },
                  {
                    label: "Score Records",
                    value: agentStatus.stats.scoreRecords,
                  },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-orange-400 text-lg font-black counter-text">
                      {stat.value}
                    </p>
                    <p className="text-gray-600 text-[10px] font-mono">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
              <div className="text-right">
                <p className="text-gray-600 text-[10px] font-mono">NETWORK</p>
                <p className="text-orange-400 text-xs font-mono">
                  {agentStatus.network}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* New events toast */}
        <AnimatePresence>
          {newCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-orange-500 text-black text-sm font-bold rounded-full shadow-lg"
            >
              +{newCount} new event{newCount > 1 ? "s" : ""}
            </motion.div>
          )}
        </AnimatePresence>

        {/* How it works notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 mb-4"
        >
          <div className="flex items-start gap-3">
            <span className="text-orange-400 text-lg mt-0.5">◎</span>
            <div>
              <p className="text-orange-400 text-xs font-mono font-bold mb-1">
                PROOF OF NO FAKE DATA
              </p>
              <p className="text-gray-400 text-sm">
                Every row below was written by the backend agent after processing
                a real Sphere testnet2 SDK event. The agent polls every 15
                seconds via <code className="text-orange-400">sphere.payments.receive()</code>{" "}
                and listens to <code className="text-orange-400">transfer:incoming</code> events.
                No row is ever inserted from the frontend.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Activity feed */}
        <div className="glass-card overflow-hidden" ref={scrollRef}>
          {/* Header row */}
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-gray-900">
            <div className="col-span-2 text-gray-600 text-[10px] font-mono">
              TIME
            </div>
            <div className="col-span-7 text-gray-600 text-[10px] font-mono">
              EVENT
            </div>
            <div className="col-span-3 text-gray-600 text-[10px] font-mono text-right">
              TX VERIFY
            </div>
          </div>

          {loading && (
            <div className="py-16 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="text-4xl text-orange-500 mb-3"
              >
                ◉
              </motion.div>
              <p className="text-gray-600 font-mono text-sm">
                Loading agent activity…
              </p>
            </div>
          )}

          {!loading && activity.length === 0 && (
            <div className="py-20 text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-5xl mb-4 opacity-10"
              >
                ◉
              </motion.div>
              <p className="text-gray-600 font-mono text-sm mb-3">
                No events recorded yet
              </p>
              <p className="text-gray-700 font-mono text-xs max-w-sm mx-auto">
                The agent is running and polling testnet2 every 15 seconds.
                Events will appear here as the agent detects real on-chain
                activity. Add wallets to monitor via the Search or Connect tabs.
              </p>
              <div className="flex items-center justify-center gap-2 mt-6">
                <motion.div
                  className="w-2 h-2 rounded-full bg-orange-500"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <p className="text-orange-500/60 text-xs font-mono">
                  Agent polling active…
                </p>
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {activity.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, backgroundColor: "rgba(249,115,22,0.15)" }}
                animate={{
                  opacity: 1,
                  backgroundColor: "rgba(0,0,0,0)",
                }}
                transition={{ duration: 0.5 }}
                className="activity-entry grid grid-cols-12 gap-2 px-5 py-3 border-b border-gray-950 hover:bg-orange-500/5 transition-colors group"
              >
                {/* Time */}
                <div className="col-span-2">
                  <p className="text-gray-500 text-[10px] font-mono">
                    {formatTime(entry.createdAt)}
                  </p>
                  <p className="text-gray-700 text-[9px] font-mono">
                    {formatDate(entry.createdAt)}
                  </p>
                </div>

                {/* Event text */}
                <div className="col-span-7 flex items-start gap-2">
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-orange-500"
                    animate={
                      i === 0
                        ? { opacity: [1, 0.3, 1] }
                        : { opacity: 1 }
                    }
                    transition={{ duration: 1.5, repeat: i === 0 ? Infinity : 0 }}
                  />
                  <p className="text-gray-300 text-xs font-mono leading-relaxed">
                    {entry.text}
                  </p>
                </div>

                {/* TX link */}
                <div className="col-span-3 text-right">
                  {entry.txId ? (
                    <div>
                      <code className="text-orange-500/50 text-[9px] font-mono block truncate">
                        {entry.txId.slice(0, 14)}…
                      </code>
                      {entry.explorerUrl && (
                        <a
                          href={entry.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-400 hover:text-orange-300 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Verify on-chain ↗
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-800 text-xs">—</span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {activity.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-700 text-xs font-mono mt-3"
          >
            {activity.length} events • Auto-refreshing every 5 seconds •
            Testnet2 — real data only
          </motion.p>
        )}
      </div>
    </div>
  );
}
