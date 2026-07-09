import { NextResponse } from "next/server";
import { getLeaderboard } from "@/agent/scorer";

export async function GET() {
  try {
    const leaderboard = await getLeaderboard(50);
    return NextResponse.json({ leaderboard });
  } catch (err) {
    console.error("[leaderboard] error:", err);
    return NextResponse.json(
      { error: "Failed to load leaderboard", leaderboard: [] },
      { status: 500 }
    );
  }
}
