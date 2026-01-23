import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { IntegrationConfig, IntegrationResponse } from './types';

export abstract class BaseIntegration {
  protected client: AxiosInstance;
  protected config: IntegrationConfig;
  protected isInitialized: boolean = false;

  constructor(config: IntegrationConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  protected setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        if (this.config.apiKey) {
          config.headers.Authorization = `Bearer ${this.config.apiKey}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const errorMessage = error.response?.data?.message || error.message;
        console.error(`[${this.config.name}] API Error:`, errorMessage);
        return Promise.reject(error);
      }
    );
  }

  abstract initialize(): Promise<void>;
  abstract healthCheck(): Promise<boolean>;

  protected async makeRequest<T>(
    endpoint: string,
    options: AxiosRequestConfig = {}
  ): Promise<IntegrationResponse<T>> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await this.client.request<T>({
        url: endpoint,
        ...options,
      });

      return {
        success: true,
        data: response.data,
        meta: {
          provider: this.config.name,
          timestamp: new Date(),
          rateLimitRemaining: response.headers['x-ratelimit-remaining']
            ? parseInt(response.headers['x-ratelimit-remaining'])
            : undefined,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        meta: {
          provider: this.config.name,
          timestamp: new Date(),
        },
      };
    }
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }
}