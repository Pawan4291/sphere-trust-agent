import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
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

    await db
      .insert(tradeEvent)
      .values({
        txId,
        walletA: cleanTag,
        walletB: counterparty,
        outcome: "completed",
      })
      .onConflictDoNothing();
  }

  await recalculateScore(cleanTag, entries[0]?.transferId || entries[0]?.id || "sync");
  return NextResponse.json({ synced: entries.length });
}