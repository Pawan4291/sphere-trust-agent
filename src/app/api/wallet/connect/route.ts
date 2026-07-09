import { NextRequest, NextResponse } from "next/server";
import { addWatchedWallet } from "@/agent/watcher";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nametag, directAddress } = body;

    if (!nametag) {
      return NextResponse.json({ error: "nametag is required" }, { status: 400 });
    }

    const cleanTag = nametag.replace(/^@/, "").toLowerCase();
    await addWatchedWallet(cleanTag, directAddress);

    return NextResponse.json({
      success: true,
      message: `Wallet @${cleanTag} registered for monitoring`,
      nametag: cleanTag,
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
