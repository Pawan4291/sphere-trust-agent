import { db } from "@/db";
import { tradeEvent, watchedWallets } from "@/db/schema";
import { sql } from "drizzle-orm";
import { recalculateScore } from "./scorer";
import { logActivity } from "./activityLogger";
import { getSphereClient } from "./sphereClient";

const processedTxIds = new Set<string>();

interface IncomingTransfer {
  tokens?: Array<{ amount: string; symbol: string; coinId?: string }>;
  senderNametag?: string;
  senderPubkey?: string;
  transferId?: string;
  id?: string;
}

async function processTransfer(
  txId: string,
  walletA: string,
  walletB: string | null,
  outcome: "completed" | "abandoned",
  description: string
): Promise<void> {
  if (processedTxIds.has(txId)) return;
  processedTxIds.add(txId);

  try {
    // Content-based dedup: skip if a trade between these same wallets was
    // already recorded within the last 2 minutes, since the mailbox drain
    // (QStash) and history sync (frontend) can report the same real trade
    // under two different real ids.
    const recentDupe = await db.execute(sql`
      SELECT id FROM trade_event
      WHERE (
        (wallet_a = ${walletA} AND wallet_b = ${walletB})
        OR (wallet_a = ${walletB} AND wallet_b = ${walletA})
      )
      AND detected_at > now() - interval '5 minutes'
      LIMIT 1
    `);
    if (recentDupe.rows.length > 0) {
      console.log(`[Agent] Skipped likely duplicate: ${walletA} <-> ${walletB}`);
      return;
    }

    await db.insert(tradeEvent).values({ txId, walletA, walletB, outcome }).onConflictDoNothing();
    await recalculateScore(walletA, txId);
    if (walletB) await recalculateScore(walletB, txId);
    await logActivity(description, txId);
    console.log(`[Agent] Processed: ${outcome} | ${txId} | ${description}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("duplicate") && !msg.includes("unique")) {
      console.error("[Agent] Error processing transfer:", err);
    }
  }
}

export async function pollWatchedWallets(): Promise<void> {
  try {
    const sphere = await getSphereClient();
    const watched = await db.select().from(watchedWallets);
    if (watched.length === 0) return;

    try {
      const { transfers } = await sphere.payments.receive(undefined, async (transfer: IncomingTransfer) => {
        const txId = transfer.transferId || transfer.id;
        if (!txId) {
          console.log("[Agent] Skipped transfer with no real id (avoiding fake id generation)");
          return;
        }

        const senderLabel = transfer.senderNametag
          ? `@${transfer.senderNametag}`
          : transfer.senderPubkey
          ? transfer.senderPubkey.slice(0, 12) + "..."
          : "unknown";

        const agentAddress = sphere.identity?.nametag
          ? `@${sphere.identity.nametag}`
          : sphere.identity?.directAddress || "agent";

        const tokenSummary = (transfer.tokens || [])
          .map((t: { amount: string; symbol: string }) => `${t.amount} ${t.symbol}`)
          .join(", ");

        // This is the agent's OWN wallet mailbox — not the connected user's
        // wallet. Recording it into trade_event double-counts trades already
        // captured correctly by sphere_getHistory sync from the user's side.
        // Log only, for visibility in Agent Activity.
        await logActivity(
          `Agent wallet received transfer from ${senderLabel}: ${tokenSummary || "tokens"} [tx: ${txId}]`,
          txId
        );
      });

      if (transfers && transfers.length > 0) {
        console.log(`[Agent] Drained ${transfers.length} incoming transfers`);
      }
    } catch (receiveErr: unknown) {
      const msg = receiveErr instanceof Error ? receiveErr.message : String(receiveErr);
      console.log("[Agent] receive() note:", msg.slice(0, 80));
    }

    console.log(`[Agent] Poll cycle complete. Watching ${watched.length} wallet(s).`);
  } catch (err) {
    console.error("[Agent] Poll error:", err);
  }
}

export function startWatcher(): void {
  console.log("[Agent] Watcher init — live listeners disabled, QStash cron drives polling");
}

export function stopWatcher(): void {}

export async function addWatchedWallet(nametag: string, directAddress?: string): Promise<void> {
  await db.insert(watchedWallets).values({ nametag, directAddress: directAddress || null }).onConflictDoNothing();
  console.log(`[Agent] Added watched wallet: ${nametag}`);
}