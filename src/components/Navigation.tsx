"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

const tabs = [
  { href: "/", label: "Connect", icon: "⬡", short: "Connect" },
  { href: "/search", label: "Search", icon: "◈", short: "Search" },
  { href: "/my-score", label: "My Score", icon: "◎", short: "Score" },
  { href: "/leaderboard", label: "Leaderboard", icon: "◆", short: "Board" },
  { href: "/activity", label: "Agent Activity", icon: "◉", short: "Live" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop Nav */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 hidden md:flex items-center justify-between px-8 py-4"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 100%)",
          borderBottom: "1px solid rgba(249,115,22,0.15)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Logo */}
       <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9">
            <div className="w-9 h-9 rounded-full overflow-hidden group-hover:scale-110 transition-transform">
              <Image src="/icon.png" alt="Trust Score Agent" width={36} height={36} className="w-full h-full object-cover" />
            </div>
            <motion.div
              className="absolute inset-0 rounded-full bg-orange-500 opacity-30 pointer-events-none"
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">
              Trust Score
            </p>
            <p className="text-orange-400 text-[10px] font-mono">
              UNICITY TESTNET2
            </p>
          </div>
        </Link>

        {/* Tabs */}
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link key={tab.href} href={tab.href}>
                <motion.div
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                    active
                      ? "text-orange-400"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {active && (
                    <motion.div
                      className="absolute inset-0 rounded-lg"
                      layoutId="nav-active"
                      style={{
                        background: "rgba(249,115,22,0.12)",
                        border: "1px solid rgba(249,115,22,0.25)",
                      }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    <span className="text-xs">{tab.icon}</span>
                    {tab.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/20 bg-black/50">
          <div className="live-dot" />
          <span className="text-orange-400 text-xs font-mono">LIVE</span>
        </div>
      </motion.nav>

      {/* Mobile Nav */}
      <motion.nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex items-center justify-around px-2 py-3"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          background: "rgba(0,0,0,0.95)",
          borderTop: "1px solid rgba(249,115,22,0.2)",
          backdropFilter: "blur(20px)",
        }}
      >
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link key={tab.href} href={tab.href} className="flex-1">
              <motion.div
                className={`flex flex-col items-center gap-0.5 py-1 rounded-lg mx-0.5 ${
                  active ? "text-orange-400" : "text-gray-500"
                }`}
                style={active ? { background: "rgba(249,115,22,0.1)" } : {}}
                whileTap={{ scale: 0.9 }}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="text-[9px] font-mono">{tab.short}</span>
              </motion.div>
            </Link>
          );
        })}
      </motion.nav>
    </>
  );
}
