import { BaseIntegration } from './base-integration';

export class IntegrationManager {
  private static instance: IntegrationManager;
  private integrations: Map<string, BaseIntegration> = new Map();

  private constructor() {}

  public static getInstance(): IntegrationManager {
    if (!IntegrationManager.instance) {
      IntegrationManager.instance = new IntegrationManager();
    }
    return IntegrationManager.instance;
  }

  public register(name: string, integration: BaseIntegration): void {
    if (!integration.isEnabled()) {
      console.log(`[IntegrationManager] ${name} is disabled, skipping registration`);
      return;
    }

    this.integrations.set(name, integration);
    console.log(`[IntegrationManager] Registered: ${name}`);
  }

  public get<T extends BaseIntegration>(name: string): T | undefined {
    return this.integrations.get(name) as T;
  }

  public async initializeAll(): Promise<void> {
    const promises = Array.from(this.integrations.values()).map((integration) =>
      integration.initialize().catch((err) => {
        console.error(`Failed to initialize integration:`, err);
      })
    );
    await Promise.all(promises);
  }

  public async healthCheckAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [name, integration] of this.integrations) {
      try {
        results[name] = await integration.healthCheck();
      } catch {
        results[name] = false;
      }
    }
    
    return results;
  }

  public listIntegrations(): string[] {
    return Array.from(this.integrations.keys());
  }
}