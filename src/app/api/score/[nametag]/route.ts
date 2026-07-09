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
  const events = await db
    .select()
    .from(tradeEvent)
    .where(
      sql`${tradeEvent.walletA} = ${"@" + cleanTag} OR ${tradeEvent.walletB} = ${"@" + cleanTag}`
    )
    .orderBy(desc(tradeEvent.detectedAt))
    .limit(50);

  const completed = events.filter((e) => e.outcome === "completed").length;
  const abandoned = events.filter((e) => e.outcome === "abandoned").length;
  const total = completed + abandoned;
  const score = total === 0 ? null : Math.round((completed / total) * 100);

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
    explorerUrl: latestTx
      ? `https://explorer.testnet2.unicity.network/tx/${latestTx}`
      : null,
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
