import { NextRequest, NextResponse } from "next/server";
import { pollWatchedWallets } from "@/agent/watcher";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    await pollWatchedWallets();
    return NextResponse.json({ success: true, syncedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}