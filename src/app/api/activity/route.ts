import { NextResponse } from "next/server";
import { getRecentActivity } from "@/agent/activityLogger";

export async function GET() {
  try {
    const activity = await getRecentActivity(100);
    return NextResponse.json({
      activity: activity.map((a) => ({
        id: a.id,
        text: a.text,
        txId: a.txId,
        createdAt: a.createdAt,
       explorerUrl: null, // no confirmed public explorer for testnet2 transfers
      })),
    });
  } catch (err) {
    console.error("[activity] error:", err);
    return NextResponse.json(
      { error: "Failed to load activity", activity: [] },
      { status: 500 }
    );
  }
}
