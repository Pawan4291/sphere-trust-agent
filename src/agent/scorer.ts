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
  if (completed === 0) return 0;

  const maxResult = await db.execute(sql`
    SELECT MAX(cnt) as max_completed FROM (
      SELECT wallet_a as wallet, COUNT(*) as cnt
      FROM trade_event
      WHERE outcome = 'completed'
      GROUP BY wallet_a
    ) counts
  `);
  const maxCompleted = Number((maxResult.rows[0] as { max_completed: string })?.max_completed || completed);

  return Math.round((completed / Math.max(maxCompleted, 1)) * 96);
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
  // Get every wallet's real completed count directly, plus their latest
  // known tx/recorded_at for display, then compute scores live against
  // the CURRENT max — never trust a stored score, since the max changes
  // as new wallets sync and old snapshots go stale.
  const counts = await db.execute(sql`
    SELECT wallet_a as wallet, COUNT(*) as completed
    FROM trade_event
    WHERE outcome = 'completed'
    GROUP BY wallet_a
  `);

  const rows = counts.rows as Array<{ wallet: string; completed: string }>;
  const maxCompleted = Math.max(...rows.map((r) => parseInt(r.completed || "0")), 1);

  const withMeta = await Promise.all(
    rows.map(async (row) => {
      const completed = parseInt(row.completed || "0");
      const score = Math.round((completed / maxCompleted) * 96);

      const latest = await db.execute(sql`
        SELECT reason_tx_id, recorded_at FROM score_history
        WHERE wallet = ${row.wallet}
        ORDER BY recorded_at DESC
        LIMIT 1
      `);
      const meta = latest.rows[0] as { reason_tx_id: string; recorded_at: Date } | undefined;

      return {
        wallet: row.wallet,
        score,
        completed,
        abandoned: 0,
        recordedAt: meta?.recorded_at || new Date(),
        reasonTxId: meta?.reason_tx_id || null,
      };
    })
  );

  return withMeta
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
