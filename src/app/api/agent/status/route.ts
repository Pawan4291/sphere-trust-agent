import { NextResponse } from "next/server";
import { db } from "@/db";
import { tradeEvent, activityLog, watchedWallets, scoreHistory } from "@/db/schema";
import { count } from "drizzle-orm";

export async function GET() {
  try {
    const [trades] = await db.select({ count: count() }).from(tradeEvent);
    const [activities] = await db.select({ count: count() }).from(activityLog);
    const [wallets] = await db.select({ count: count() }).from(watchedWallets);
    const [scores] = await db.select({ count: count() }).from(scoreHistory);

    return NextResponse.json({
      status: "running",
      network: "testnet2",
      stats: {
        tradeEvents: trades.count,
        activityLogs: activities.count,
        watchedWallets: wallets.count,
        scoreRecords: scores.count,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
