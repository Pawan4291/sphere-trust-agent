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
        explorerUrl: a.txId
          ? `https://explorer.testnet2.unicity.network/tx/${a.txId}`
          : null,
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
