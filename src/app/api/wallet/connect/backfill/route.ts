import { NextRequest, NextResponse } from "next/server";
import { recordUserTransaction } from "@/agent/watcher";

export async function POST(req: NextRequest) {
  try {
    const { nametag, history } = await req.json();
    if (!Array.isArray(history)) {
      return NextResponse.json({ error: "history must be an array" }, { status: 400 });
    }

    for (const entry of history) {
      const txId = entry.transferId || entry.id;
      if (!txId) continue;
      const counterparty = entry.counterpartyNametag
        ? `@${entry.counterpartyNametag}`
        : entry.recipient || entry.sender || null;
      const outcome = entry.status === "completed" ? "completed" : "abandoned";
      await recordUserTransaction(nametag, txId, counterparty, outcome);
    }

    return NextResponse.json({ success: true, backfilled: history.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}