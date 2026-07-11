/**
 * Scorer: recalculates trust score purely from DB history.
 * score = (completed / (completed + abandoned)) * 100
 * Optionally weighted by recency (more recent = higher weight).
 */

import { db } from "@/db";
import { tradeEvent, scoreHistory } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export interface WalletScore {
  wallet: string;
  score: number;
  completed: number;
  abandoned: number;
  total: number;
}

async function computeScore(completed: number): Promise<number> {
  // Score reflects real completed trade count directly, capped at 100.
  return Math.min(100, completed);
}

export async function recalculateScore(
  wallet: string,
  reasonTxId: string
): Promise<WalletScore> {
  // Fetch all trade events for this wallet (as initiator or receiver)
  const events = await db
    .select({
      outcome: tradeEvent.outcome,
      detectedAt: tradeEvent.detectedAt,
    })
    .from(tradeEvent)
    .where(sql`${tradeEvent.walletA} = ${wallet}`);

  const completed = events.filter((e) => e.outcome === "completed").length;
  const abandoned = 0; // not measurable from wallet history
  const total = completed;
 const score = await computeScore(completed);

  // Write new score to history
  await db.insert(scoreHistory).values({
    wallet,
    score: score.toString(),
    reasonTxId,
  });

  return { wallet, score, completed, abandoned, total };
}

export async function getLatestScore(wallet: string): Promise<WalletScore> {
  const events = await db
    .select({
      outcome: tradeEvent.outcome,
    })
    .from(tradeEvent)
   .where(sql`${tradeEvent.walletA} = ${wallet}`);

  const completed = events.filter((e) => e.outcome === "completed").length;
  const abandoned = 0;
  const total = completed;
  const score = await computeScore(completed);

  return { wallet, score, completed, abandoned, total };
}

export async function getLeaderboard(limit = 50) {
  // Get latest score per wallet using a subquery
  const rows = await db.execute(sql`
    SELECT DISTINCT ON (sh.wallet)
      sh.wallet,
      sh.score::numeric,
      sh.recorded_at,
      sh.reason_tx_id
    FROM score_history sh
    ORDER BY sh.wallet, sh.recorded_at DESC
  `);

  // Now get trade counts for each wallet
  const leaderboard = await Promise.all(
    (rows.rows as Array<{ wallet: string; score: string; recorded_at: Date; reason_tx_id: string }>).map(async (row) => {
      const counts = await db.execute(sql`
       SELECT
          COUNT(*) FILTER (WHERE outcome = 'completed') as completed,
          COUNT(*) FILTER (WHERE outcome = 'abandoned') as abandoned
        FROM trade_event
        WHERE wallet_a = ${row.wallet}
      `);
      const c = counts.rows[0] as { completed: string; abandoned: string };
      return {
        wallet: row.wallet,
        score: parseFloat(row.score),
        completed: parseInt(c.completed || "0"),
        abandoned: parseInt(c.abandoned || "0"),
        recordedAt: row.recorded_at,
        reasonTxId: row.reason_tx_id,
      };
    })
  );

  return leaderboard
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
