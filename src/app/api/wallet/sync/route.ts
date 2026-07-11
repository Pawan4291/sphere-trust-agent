import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { logActivity } from "@/agent/activityLogger";
import { tradeEvent } from "@/db/schema";
import { recalculateScore } from "@/agent/scorer";

export async function POST(req: NextRequest) {
  const { nametag, entries } = await req.json();
  const cleanTag = "@" + nametag.replace(/^@/, "").toLowerCase();

  for (const e of entries) {
    if (e.type !== "SENT" && e.type !== "RECEIVED") continue;
    const txId = e.transferId || e.id;
    const counterparty =
      e.type === "SENT"
        ? e.recipientNametag ? "@" + e.recipientNametag : null
        : e.senderNametag ? "@" + e.senderNametag : null;

    if (!txId) continue;
    const outcome = e.status === "failed" || !counterparty ? "abandoned" : "completed";
   await db
      .insert(tradeEvent)
      .values({
        txId,
        walletA: cleanTag,
        walletB: counterparty,
        outcome,
        detectedAt: e.timestamp ? new Date(e.timestamp) : new Date(),
      })
      .onConflictDoNothing();
  }

  await recalculateScore(cleanTag, entries[0]?.transferId || entries[0]?.id || "sync");
  if (entries?.length) {
    const logText = `${cleanTag} synced ${entries.length} real trade${entries.length === 1 ? "" : "s"} from testnet2`;
    const recentLog = await db.execute(sql`
      SELECT id FROM activity_log
      WHERE text = ${logText}
      AND created_at > now() - interval '20 seconds'
      LIMIT 1
    `);
    if (recentLog.rows.length === 0) {
      await logActivity(logText, entries[0]?.transferId || entries[0]?.id || null);
    }
  }
  return NextResponse.json({ synced: entries.length });
}