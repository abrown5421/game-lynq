import { Router } from 'express';
import { IntegrationManager } from '../core/integration-manager';

const router = Router();

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

export default router;