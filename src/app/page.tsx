"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import ParticleBackground from "@/components/ParticleBackground";
import Navigation from "@/components/Navigation";
import ScoreRing from "@/components/ScoreRing";
import Link from "next/link";

const SPHERE_WALLET_URL = "https://sphere.unicity.network";

interface ConnectResult {
  nametag?: string;
  directAddress?: string;
  chainPubkey?: string;
}

type ConnectionState = "idle" | "connecting" | "connected" | "error";

export default function ConnectPage() {
  const [connState, setConnState] = useState<ConnectionState>("idle");
  const [identity, setIdentity] = useState<ConnectResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [agentStats, setAgentStats] = useState<{
    watchedWallets: number;
    tradeEvents: number;
    activityLogs: number;
  } | null>(null);
  const [typedText, setTypedText] = useState("");
  const popupRef = useRef<Window | null>(null);
  const sessionKey = "sphere-trust-session";
  const clientRef = useRef<unknown>(null);

  const heroText = "AUTONOMOUS TRUST SCORING ON UNICITY TESTNET2";
  
  // Typewriter effect
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= heroText.length) {
        setTypedText(heroText.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // Load agent stats
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/agent/status");
        const data = await res.json();
        if (data.stats) setAgentStats(data.stats);
      } catch {}
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  // Try to restore session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(sessionKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setIdentity(parsed);
        setConnState("connected");
      } catch {}
    }
  }, []);

  const connectWithSpherePopup = async () => {
    setConnState("connecting");
    setErrorMsg("");

    try {
      // Dynamic import of sphere-sdk connect module (browser-only)
      const { autoConnect } = await import(
        "@unicitylabs/sphere-sdk/connect/browser"
      );
      const { SPHERE_NETWORKS } = await import(
        "@unicitylabs/sphere-sdk/connect"
      );

      const result = await autoConnect({
        dapp: {
          name: "Unicity Trust Score Agent",
          url: location.origin,
        },
        walletUrl: SPHERE_WALLET_URL,
        network: SPHERE_NETWORKS.testnet2,
        silent: false,
      });

      const conn = result.connection;
      const id: ConnectResult = {
        nametag: conn.identity?.nametag,
        directAddress: conn.identity?.directAddress,
        chainPubkey: conn.identity?.chainPubkey,
      };

      clientRef.current = result.client;
      setIdentity(id);
      setConnState("connected");
      localStorage.setItem(sessionKey, JSON.stringify(id));

      // Register wallet with agent backend
      if (id.nametag || id.directAddress) {
        await fetch("/api/wallet/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nametag: id.nametag || id.directAddress || "unknown",
            directAddress: id.directAddress,
          }),
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      
      // If SDK not available in browser context, fallback to manual entry
      if (msg.includes("Cannot find module") || msg.includes("not defined")) {
        // Manual fallback: open Sphere wallet and let user copy nametag
        setConnState("idle");
        handleManualConnect();
        return;
      }
      
      setErrorMsg(msg.slice(0, 120));
      setConnState("error");
    }
  };

  const handleManualConnect = () => {
    const popup = window.open(
      `${SPHERE_WALLET_URL}/connect?origin=${encodeURIComponent(location.origin)}&dapp=Trust+Score+Agent`,
      "sphere-wallet",
      "width=440,height=700,resizable=yes,scrollbars=yes"
    );
    popupRef.current = popup;

    // Show manual input after popup opens
    setConnState("connecting");
    setTimeout(() => {
      const tag = window.prompt(
        "Enter your Sphere wallet nametag (e.g. alice) to register for monitoring:"
      );
      if (tag) {
        const cleaned = tag.replace(/^@/, "").toLowerCase().trim();
        const id: ConnectResult = { nametag: cleaned };
        setIdentity(id);
        setConnState("connected");
        localStorage.setItem(sessionKey, JSON.stringify(id));
        fetch("/api/wallet/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nametag: cleaned }),
        }).catch(() => {});
      } else {
        setConnState("idle");
      }
    }, 500);
  };

  const disconnect = () => {
    setIdentity(null);
    setConnState("idle");
    localStorage.removeItem(sessionKey);
    clientRef.current = null;
  };

  const stats = [
    { label: "Network", value: "Testnet2", icon: "⬡" },
    { label: "Protocol", value: "Sphere v2", icon: "◎" },
    { label: "Wallets Watched", value: agentStats?.watchedWallets ?? "—", icon: "◈" },
    { label: "Trade Events", value: agentStats?.tradeEvents ?? "—", icon: "◆" },
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-x-hidden">
      <ParticleBackground />
      <div className="scan-line" />
      <Navigation />

      {/* Hero */}
      <div
        className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pt-20"
        style={{
          backgroundImage: `radial-gradient(ellipse at 50% 50%, rgba(249,115,22,0.08) 0%, transparent 70%)`,
        }}
      >
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 grid-pattern opacity-30" />

        {/* Main content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/5 mb-8"
          >
            <div className="live-dot" />
            <span className="text-orange-400 text-xs font-mono tracking-widest">
              AUTONOMOUS AGENT ACTIVE
            </span>
          </motion.div>

          {/* Main title */}
          <motion.h1
            className="text-5xl md:text-7xl font-black mb-6 leading-none"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <span className="gradient-text glow-orange-text">TRUST</span>
            <br />
            <span className="text-white">SCORE</span>
            <br />
            <span className="gradient-text glow-orange-text">AGENT</span>
          </motion.h1>

          {/* Typewriter */}
          <motion.p
            className="text-gray-400 text-sm md:text-base font-mono mb-12 max-w-2xl mx-auto cursor-blink"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {typedText}
          </motion.p>

          {/* Stats row */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                className="glass-card p-4 text-center"
                whileHover={{ y: -2, borderColor: "rgba(249,115,22,0.4)" }}
                transition={{ delay: 0.9 + i * 0.1 }}
              >
                <div className="text-2xl mb-1 text-orange-400">{s.icon}</div>
                <div className="text-white font-bold text-lg counter-text">
                  {s.value}
                </div>
                <div className="text-gray-500 text-xs font-mono mt-0.5">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Connect panel */}
          <AnimatePresence mode="wait">
            {connState === "connected" && identity ? (
              <motion.div
                key="connected"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-card p-8 max-w-md mx-auto glow-border"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-2xl">
                    ◎
                  </div>
                  <div className="text-left">
                    <p className="text-orange-400 text-xs font-mono">
                      CONNECTED WALLET
                    </p>
                    <p className="text-white font-bold text-xl">
                      {identity.nametag ? `@${identity.nametag}` : "Wallet"}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <div className="live-dot" />
                  </div>
                </div>

                {identity.directAddress && (
                  <div className="bg-black/50 rounded-lg p-3 mb-4 border border-gray-800">
                    <p className="text-gray-500 text-[10px] font-mono mb-1">
                      DIRECT ADDRESS
                    </p>
                    <p className="text-gray-300 text-xs font-mono break-all">
                      {identity.directAddress.slice(0, 40)}…
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Link
                    href="/my-score"
                    className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-400 text-black font-bold text-sm rounded-lg transition-colors text-center"
                  >
                    View My Score →
                  </Link>
                  <button
                    onClick={disconnect}
                    className="px-4 py-3 border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white text-sm rounded-lg transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="not-connected"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="max-w-md mx-auto"
              >
                <div className="glass-card p-8 glow-border">
                  <div className="flex justify-center mb-6">
                    <motion.div
                      className="w-20 h-20 rounded-full border-2 border-orange-500/40 flex items-center justify-center text-4xl"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      ⬡
                    </motion.div>
                  </div>

                  <h2 className="text-white text-xl font-bold text-center mb-2">
                    Connect Sphere Wallet
                  </h2>
                  <p className="text-gray-500 text-sm text-center mb-6 font-mono">
                    Connect your Unicity Sphere wallet to monitor your trust
                    score in real-time
                  </p>

                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4"
                    >
                      <p className="text-red-400 text-xs font-mono">{errorMsg}</p>
                    </motion.div>
                  )}

                  <motion.button
                    onClick={connectWithSpherePopup}
                    disabled={connState === "connecting"}
                    className="w-full py-4 bg-orange-500 hover:bg-orange-400 disabled:bg-orange-800 text-black font-bold text-base rounded-xl transition-colors glow-orange relative overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {connState === "connecting" ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        >
                          ◎
                        </motion.span>
                        Connecting…
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        ⬡ Connect with Sphere
                      </span>
                    )}
                    <div className="absolute inset-0 animate-shimmer" />
                  </motion.button>

                  <p className="text-center text-gray-600 text-xs mt-4 font-mono">
                    Opens Sphere wallet at sphere.unicity.network
                  </p>
                </div>

                {/* How it works */}
                <div className="mt-6 space-y-2">
                  {[
                    {
                      step: "01",
                      text: "Agent watches real Sphere testnet2 transfers every 15s",
                    },
                    {
                      step: "02",
                      text: "Classifies each event: completed trade or abandoned intent",
                    },
                    {
                      step: "03",
                      text: "Scores wallet: (completed/total) × 100 — pure on-chain data",
                    },
                  ].map((item) => (
                    <motion.div
                      key={item.step}
                      className="flex items-start gap-3 px-4 py-3 rounded-lg bg-black/40 border border-gray-900"
                      whileHover={{ borderColor: "rgba(249,115,22,0.3)" }}
                    >
                      <span className="text-orange-500 font-mono text-xs font-bold mt-0.5">
                        {item.step}
                      </span>
                      <span className="text-gray-400 text-sm">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pb-20 md:pb-6 pt-12">
        <p className="text-gray-700 text-xs font-mono">
          This agent runs autonomously — no human approval per action. No mock
          data. No Astrid OS.
        </p>
      </div>
    </div>
  );
}
