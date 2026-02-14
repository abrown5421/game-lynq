import axios from "axios";
import { BaseIntegration } from "../core/base-integration";
import { IntegrationConfig, IntegrationResponse } from "../core/types";

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token: string;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string; height: number; width: number }[];
  genres: string[];
  popularity: number;
  external_urls: { spotify: string };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    images: { url: string; height: number; width: number }[];
  };
  preview_url: string | null;
  duration_ms: number;
  external_urls: { spotify: string };
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string; height: number; width: number }[];
  owner: { display_name: string };
  tracks: { total: number };
  external_urls: { spotify: string };
}

export interface SpotifySearchResults {
  artists?: {
    items: SpotifyArtist[];
    total: number;
  };
  playlists?: {
    items: SpotifyPlaylist[];
    total: number;
  };
}

export class SpotifyProvider extends BaseIntegration {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(config: IntegrationConfig) {
    super({
      ...config,
      baseUrl: "https://api.spotify.com/v1",
    });

    this.clientId = config.apiKey || process.env.SPOTIFY_CLIENT_ID || "";
    this.clientSecret = config.apiSecret || process.env.SPOTIFY_CLIENT_SECRET || "";
    this.redirectUri = process.env.SPOTIFY_REDIRECT_URI || "http://localhost:5000/api/integrations/spotify/callback";

    if (!this.clientId || !this.clientSecret) {
      console.warn("[SpotifyProvider] Missing client credentials");
    }
  }

  async initialize(): Promise<void> {
    this.isInitialized = true;
    console.log("[SpotifyProvider] Initialized");
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get("https://api.spotify.com/v1", {
        validateStatus: () => true,
      });
      return response.status === 401 || response.status === 200; 
    } catch {
      return false;
    }
  }

  getAuthorizationUrl(state: string): string {
    const scopes = [
      "user-read-email",
      "user-read-private",
      "playlist-read-private",
      "playlist-read-collaborative",
      "streaming",
      "user-read-playback-state",
    ];

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: "code",
      redirect_uri: this.redirectUri,
      scope: scopes.join(" "),
      state: state,
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<IntegrationResponse<SpotifyTokenResponse>> {
    try {
      const response = await axios.post<SpotifyTokenResponse>(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: this.redirectUri,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64")}`,
          },
        }
      );

      return {
        success: true,
        data: response.data,
        meta: {
          provider: this.config.name,
          timestamp: new Date(),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error_description || error.message,
        meta: {
          provider: this.config.name,
          timestamp: new Date(),
        },
      };
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<IntegrationResponse<SpotifyTokenResponse>> {
    try {
      const response = await axios.post<SpotifyTokenResponse>(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64")}`,
          },
        }
      );

      return {
        success: true,
        data: response.data,
        meta: {
          provider: this.config.name,
          timestamp: new Date(),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error_description || error.message,
        meta: {
          provider: this.config.name,
          timestamp: new Date(),
        },
      };
    }
  }

  async search(
    query: string,
    accessToken: string,
    types: ("artist" | "playlist")[] = ["artist", "playlist"],
    limit: number = 10
  ): Promise<IntegrationResponse<SpotifySearchResults>> {
    try {
      const response = await axios.get<SpotifySearchResults>(
        `${this.config.baseUrl}/search`,
        {
          params: {
            q: query,
            type: types.join(","),
            limit: limit,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return {
        success: true,
        data: response.data,
        meta: {
          provider: this.config.name,
          timestamp: new Date(),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        meta: {
          provider: this.config.name,
          timestamp: new Date(),
        },
      };
    }
  }

  async getArtistDiscography(
    artistId: string,
    accessToken: string,
    limit: number = 200
  ): Promise<IntegrationResponse<SpotifyTrack[]>> {
    try {
      const albumsResponse = await axios.get(
        `${this.config.baseUrl}/artists/${artistId}/albums`,
        {
          params: {
            include_groups: "album,single",
            limit: 50,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const albums = albumsResponse.data.items;
      const allTracks: SpotifyTrack[] = [];

      for (const album of albums.slice(0, 10)) {
        const tracksResponse = await axios.get(
          `${this.config.baseUrl}/albums/${album.id}/tracks`,
          {
            params: { limit: 50 },
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const trackIds = tracksResponse.data.items.map((t: any) => t.id).join(",");
        if (trackIds) {
          const fullTracksResponse = await axios.get(
            `${this.config.baseUrl}/tracks`,
            {
              params: { ids: trackIds },
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          allTracks.push(...fullTracksResponse.data.tracks.filter((t: SpotifyTrack) => t.preview_url));
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const shuffled = allTracks.sort(() => Math.random() - 0.5);
      const limited = shuffled.slice(0, limit);

      return {
        success: true,
        data: limited,
        meta: {
          provider: this.config.name,
          timestamp: new Date(),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        meta: {
          provider: this.config.name,
          timestamp: new Date(),
        },
      };
    }
  }

  async getPlaylistTracks(
    playlistId: string,
    accessToken: string,
    limit: number = 200
  ): Promise<IntegrationResponse<SpotifyTrack[]>> {
    try {
      const tracks: SpotifyTrack[] = [];
      let offset = 0;
      const batchSize = 100;

      while (tracks.length < limit) {
        const response = await axios.get(
          `${this.config.baseUrl}/playlists/${playlistId}/tracks`,
          {
            params: {
              limit: batchSize,
              offset: offset,
            },
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const items = response.data.items
          .map((item: any) => item.track)
          .filter((track: SpotifyTrack) => track && track.preview_url);

        tracks.push(...items);

        if (response.data.next === null || items.length === 0) {
          break;
        }

        offset += batchSize;
      }

      const shuffled = tracks.sort(() => Math.random() - 0.5);
      const limited = shuffled.slice(0, limit);

      return {
        success: true,
        data: limited,
        meta: {
          provider: this.config.name,
          timestamp: new Date(),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        meta: {
          provider: this.config.name,
          timestamp: new Date(),
        },
      };
    }
  }

  async getCurrentUser(accessToken: string): Promise<IntegrationResponse<any>> {
    try {
      const response = await axios.get(`${this.config.baseUrl}/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return {
        success: true,
        data: response.data,
        meta: {
          provider: this.config.name,
          timestamp: new Date(),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        meta: {
          provider: this.config.name,
          timestamp: new Date(),
        },
      };
    }
  }
}