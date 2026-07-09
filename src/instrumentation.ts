/**
 * Next.js instrumentation hook — runs once when the server starts.
 * This is the correct place to start background agents in Next.js App Router.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initAgent } = await import("./lib/agentInit");
    await initAgent();
  }
}
