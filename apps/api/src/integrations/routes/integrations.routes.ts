import { Router } from 'express';
import { IntegrationManager } from '../core/integration-manager';
import { ITunesProvider } from '../providers/itunes.provider';
import { SpotifyProvider } from '../providers/spotify.provider';
import { loadIntegrationConfigs } from '../core/config-loader';
import spotifyRoutes from './spotify.routes';

const router = Router();

const manager = IntegrationManager.getInstance();
const configs = loadIntegrationConfigs();

const iTunesConfig = configs["itunes"] || {
  name: "itunes",
  enabled: true,
};

const spotifyConfig = configs["spotify"] || {
  name: "spotify",
  apiKey: process.env.SPOTIFY_CLIENT_ID,
  apiSecret: process.env.SPOTIFY_CLIENT_SECRET,
  enabled: !!process.env.SPOTIFY_CLIENT_ID && !!process.env.SPOTIFY_CLIENT_SECRET,
};

manager.register("itunes", new ITunesProvider(iTunesConfig));
manager.register("spotify", new SpotifyProvider(spotifyConfig));

router.use('/spotify', spotifyRoutes);

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
  const { term, limit } = req.query;

  if (!term) {
    return res.status(400).json({ error: "Search term is required" });
  }

  const manager = IntegrationManager.getInstance();
  const iTunes = manager.get<any>("itunes");

  if (!iTunes) {
    return res.status(500).json({ error: "iTunes provider not found" });
  }

  try {
    const result = await iTunes.searchTracks({
      term: term as string,
      limit: Number(limit) || 60,
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ tracks: result.data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch tracks" });
  }
});

export default router;