/**
 * Activity logger: writes a row to activity_log for each processed event.
 * Every row here originated from a real SDK call — no invented data.
 */

import { db } from "@/db";
import { activityLog } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function logActivity(
  message: string,
  txId: string | null = null
): Promise<void> {
  await db.insert(activityLog).values({
    text: message,
    txId: txId || null,
  });
}

export async function getRecentActivity(limit = 100) {
  return db
    .select()
    .from(activityLog)
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);
}
