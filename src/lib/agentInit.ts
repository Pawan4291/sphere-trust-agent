/**
 * Singleton agent initializer.
 * Called once from the Next.js instrumentation hook so the watcher runs
 * as a background loop from server boot, independent of any HTTP request.
 */

let agentStarted = false;

export async function initAgent() {
  if (agentStarted) return;
  agentStarted = true;

  // Dynamic import to avoid edge runtime issues
  const { startWatcher } = await import("@/agent/watcher");
  startWatcher();
  console.log("[AgentInit] Background watcher loop started");
}
