import axios from "axios";
import { BaseIntegration } from "../core/base-integration";
import { IntegrationConfig, IntegrationResponse } from "../core/types";

export interface ITunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  previewUrl: string;
  [key: string]: any;
}

export interface ITunesSearchParams {
  term: string;
  limit?: number;
  country?: string;
}

export class ITunesProvider extends BaseIntegration {
  constructor(config: IntegrationConfig) {
    super({ ...config, baseUrl: "https://itunes.apple.com" });
  }

  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get("https://itunes.apple.com/search", {
        params: { term: "test", limit: 1 },
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async searchTracks(
    params: ITunesSearchParams
    ): Promise<IntegrationResponse<ITunesTrack[]>> {
    const { term, limit = 60, country = "US" } = params;

    const res = await this.makeRequest<{ resultCount: number; results: ITunesTrack[] }>("/search", {
        method: "GET",
        params: { term, entity: "musicTrack", limit, country },
    });

    if (res.success && res.data) {
        return { ...res, data: res.data.results };
    }

    return { ...res, data: [] };
    }

  
}
