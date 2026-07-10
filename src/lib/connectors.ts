// Connector architecture — a provider-independent interface so pages and
// route handlers never contain provider-specific logic. Production providers
// (Microsoft 365, Google Drive, S3, …) implement the same interface; the
// demo provider is a complete, deterministic implementation that requires no
// external credentials.

import { DEMO_RESOURCES, type DemoResource } from "@/data/demo";

export interface ConnectorHealth {
  ok: boolean;
  detail: string;
}

export interface ConnectorProvider {
  readonly provider: string;
  validateConnection(configuration: unknown): Promise<ConnectorHealth>;
  /** List the resources the connector is permitted to see (metadata only). */
  listResources(configuration: unknown): Promise<DemoResource[]>;
  /** Normalize a provider resource into the internal metadata shape. */
  normalizeResource(raw: DemoResource): DemoResource;
}

/** Demo Corporate Drive — deterministic fictional resources, no credentials. */
export const demoConnectorProvider: ConnectorProvider = {
  provider: "demo_connector",
  async validateConnection() {
    return { ok: true, detail: "Demo connector is always reachable." };
  },
  async listResources() {
    // Stable, fictional, and identical on every call.
    return DEMO_RESOURCES.map((r) => ({ ...r }));
  },
  normalizeResource(raw) {
    return { ...raw };
  },
};

const PROVIDERS: Record<string, ConnectorProvider> = {
  demo_connector: demoConnectorProvider,
};

export function getConnectorProvider(provider: string): ConnectorProvider | null {
  return PROVIDERS[provider] ?? null;
}
