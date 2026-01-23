export interface IntegrationConfig {
  name: string;
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
  webhookSecret?: string;
  enabled: boolean;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
}

export interface IntegrationResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    provider: string;
    timestamp: Date;
    rateLimitRemaining?: number;
  };
}

export interface WebhookEvent {
  provider: string;
  event: string;
  data: any;
  signature?: string;
  timestamp: Date;
}