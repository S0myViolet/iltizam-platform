// Next.js instrumentation hook — runs once per server process. Restores the
// active-monitoring loop so connectors with monitoringEnabled keep scanning
// after a restart.

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureMonitorLoop } = await import("./lib/monitor");
    ensureMonitorLoop();
  }
}
