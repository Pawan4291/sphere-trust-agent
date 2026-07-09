import {
  pgTable,
  serial,
  text,
  numeric,
  timestamp,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const tradeEvent = pgTable(
  "trade_event",
  {
    id: serial("id").primaryKey(),
    txId: text("tx_id").unique().notNull(),
    walletA: text("wallet_a").notNull(),
    walletB: text("wallet_b"),
    outcome: text("outcome").notNull(),
    detectedAt: timestamp("detected_at").defaultNow(),
  },
  (table) => [
    check(
      "outcome_check",
      sql`${table.outcome} IN ('completed', 'abandoned')`
    ),
  ]
);

export const scoreHistory = pgTable("score_history", {
  id: serial("id").primaryKey(),
  wallet: text("wallet").notNull(),
  score: numeric("score").notNull(),
  reasonTxId: text("reason_tx_id").references(() => tradeEvent.txId),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  txId: text("tx_id").references(() => tradeEvent.txId),
  createdAt: timestamp("created_at").defaultNow(),
});

export const watchedWallets = pgTable("watched_wallets", {
  id: serial("id").primaryKey(),
  nametag: text("nametag").unique().notNull(),
  directAddress: text("direct_address"),
  addedAt: timestamp("added_at").defaultNow(),
});
