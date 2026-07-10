import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tradeEvent } from "@/db/schema";
import { recalculateScore } from "@/agent/scorer";

export async function POST(req: NextRequest) {
  const { nametag, history } = await req.json();
  const tag = "@" + String(nametag).replace(/^@/, "").toLowerCase();

  console.log("SAMPLE HISTORY ITEM:", JSON.stringify(history?.[0], null, 2));

  for (const e of history || []) {
    if (e.type !== "SENT" && e.type !== "RECEIVED") continue;
    const txId = e.transferId || e.id;
    const counterparty =
      e.type === "SENT"
        ? e.recipientNametag ? "@" + e.recipientNametag : null
        : e.senderNametag ? "@" + e.senderNametag : null;

    if (!txId) continue;
    const outcome = e.status === "failed" || !counterparty ? "abandoned" : "completed";
   await db.insert(tradeEvent).values({
      txId, walletA: tag, walletB: counterparty, outcome,
      detectedAt: e.timestamp ? new Date(e.timestamp) : new Date(),
    }).onConflictDoNothing();
  }

  if (history?.length) {
    await recalculateScore(tag, history[0].transferId || history[0].id || "sync");
  }
  return NextResponse.json({ synced: history?.length || 0 });
}