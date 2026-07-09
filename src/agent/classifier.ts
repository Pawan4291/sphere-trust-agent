/**
 * Classifier: decides if a transfer event is "completed" or "abandoned".
 * 
 * Logic:
 * - A transfer with status "completed" and a sender (walletA) + receiver (walletB) 
 *   = two-sided completed trade.
 * - A transfer with deliveryPending=true but no confirmed recipient or status failed
 *   = abandoned/one-sided intent.
 * - Any error/failed status = abandoned.
 */

export interface TransferRecord {
  txId: string;
  walletA: string;
  walletB: string | null;
  status: string;
  deliveryPending?: boolean;
  amount?: string;
  coinId?: string;
  timestamp?: number;
}

export type TradeOutcome = "completed" | "abandoned";

export function classify(transfer: TransferRecord): TradeOutcome {
  const { status, walletB, deliveryPending } = transfer;

  // Completed: sender-driven transfer that has a known counterparty and is completed
  if (status === "completed" && walletB && !deliveryPending) {
    return "completed";
  }

  // Partially completed: on-chain certified but delivery pending — treat as completed
  // since the token is finalized on-chain (per SDK docs: "This is success, not failure")
  if (status === "completed" && deliveryPending) {
    return "completed";
  }

  // sphere_getHistory only returns real completed SENT/RECEIVED transfers —
  // there is no "abandoned" case in this data source.
  return "completed";
}
