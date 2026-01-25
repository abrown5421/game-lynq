import { Router } from 'express';
import { IntegrationManager } from '../core/integration-manager';
import { ITunesProvider } from '../providers/itunes.provider';
import { loadIntegrationConfigs } from '../core/config-loader';

const router = Router();

const manager = IntegrationManager.getInstance();
const configs = loadIntegrationConfigs();

const iTunesConfig = configs["itunes"] || {
  name: "itunes",
  enabled: true,
};

manager.register("itunes", new ITunesProvider(iTunesConfig));

router.get('/health', async (req, res) => {
  const manager = IntegrationManager.getInstance();
  const health = await manager.healthCheckAll();
  res.json({
    integrations: health,
    available: manager.listIntegrations(),
  });
});

router.post('/webhooks/:provider', async (req, res) => {
  const { provider } = req.params;
  const signature = req.headers['stripe-signature'] as string;

  const manager = IntegrationManager.getInstance();
  const integration = manager.get<any>(provider);

  if (!integration) {
    return res.status(404).json({ error: 'Provider not found' });
  }

  if (integration.verifyWebhookSignature) {
    const isValid = integration.verifyWebhookSignature(
      JSON.stringify(req.body),
      signature
    );
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  console.log(`[Webhook] ${provider}:`, req.body.type);
  res.json({ received: true });
});

router.get("/itunes/search", async (req, res) => {
  const { genre, trackCount } = req.query;

  if (!genre) return res.status(400).json({ error: "Genre is required" });

  const manager = IntegrationManager.getInstance();
  const iTunes = manager.get<any>("itunes");

  if (!iTunes) return res.status(500).json({ error: "iTunes provider not found" });

  try {
    const result = await iTunes.searchTracks({
      term: genre as string,
      limit: Number(trackCount) || 60,
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ tracks: result.data });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tracks" });
  }
});

export default router;