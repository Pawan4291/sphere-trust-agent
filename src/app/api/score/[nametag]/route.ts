import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tradeEvent, scoreHistory, watchedWallets } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { addWatchedWallet } from "@/agent/watcher";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ nametag: string }> }
) {
  const { nametag } = await params;
  const cleanTag = nametag.replace(/^@/, "").toLowerCase();

  // Register this wallet for watching (so the agent picks it up)
  try {
    await addWatchedWallet(cleanTag);
  } catch {
    // ignore duplicates
  }

  // Get trade events for this wallet
  const allEvents = await db
    .select()
    .from(tradeEvent)
    .where(
      sql`${tradeEvent.walletA} = ${"@" + cleanTag} OR ${tradeEvent.walletB} = ${"@" + cleanTag}`
    )
    .orderBy(desc(tradeEvent.detectedAt));

  const events = allEvents.slice(0, 50);

 const completed = allEvents.filter((e) => e.outcome === "completed").length;
  const abandoned = allEvents.filter((e) => e.outcome === "abandoned").length;
  const total = completed + abandoned;

  const { getLatestScore } = await import("@/agent/scorer");
  const latest = await getLatestScore("@" + cleanTag);
  const score = total === 0 ? null : latest.score;

  // Get score history
  const history = await db
    .select()
    .from(scoreHistory)
    .where(sql`${scoreHistory.wallet} = ${"@" + cleanTag}`)
    .orderBy(desc(scoreHistory.recordedAt))
    .limit(30);

  // Most recent tx for verification
  const latestTx = events[0]?.txId || null;

  return NextResponse.json({
    nametag: cleanTag,
    score,
    completed,
    abandoned,
    total,
    latestTxId: latestTx,
    explorerUrl: null, // no confirmed public per-transfer explorer exists for testnet2 token transfers
    scoreHistory: history.map((h) => ({
      score: parseFloat(h.score),
      recordedAt: h.recordedAt,
      reasonTxId: h.reasonTxId,
    })),
    recentEvents: events.slice(0, 10).map((e) => ({
      txId: e.txId,
      outcome: e.outcome,
      walletA: e.walletA,
      walletB: e.walletB,
      detectedAt: e.detectedAt,
    })),
  });
}
