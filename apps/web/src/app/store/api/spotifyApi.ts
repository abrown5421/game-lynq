import { baseApi } from "./baseApi";

export interface SpotifyConnectionStatus {
  connected: boolean;
  spotifyDisplayName?: string;
  spotifyEmail?: string;
  expiresAt?: string;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string; height: number; width: number }[];
  genres: string[];
  popularity: number;
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
  artists: SpotifyArtist[];
  playlists: SpotifyPlaylist[];
}

export interface Track {
  name: string;
  artist: string;
  previewUrl: string;
  artwork: string;
}

export const spotifyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSpotifyStatus: builder.query<SpotifyConnectionStatus, void>({
      query: () => "/integrations/spotify/status",
      providesTags: ["Auth"],
    }),

    connectSpotify: builder.mutation<{ authUrl: string }, void>({
      query: () => ({
        url: "/integrations/spotify/connect",
        method: "GET",
      }),
    }),

    disconnectSpotify: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: "/integrations/spotify/disconnect",
        method: "POST",
      }),
      invalidatesTags: ["Auth"],
    }),

    searchSpotify: builder.query<SpotifySearchResults, { query: string; limit?: number }>({
      query: ({ query, limit = 10 }) => ({
        url: "/integrations/spotify/search",
        params: { query, limit },
      }),
    }),

    getArtistTracks: builder.query<{ tracks: Track[] }, { artistId: string; limit?: number }>({
      query: ({ artistId, limit = 200 }) => ({
        url: `/integrations/spotify/artist/${artistId}/tracks`,
        params: { limit },
      }),
    }),

    getPlaylistTracks: builder.query<{ tracks: Track[] }, { playlistId: string; limit?: number }>({
      query: ({ playlistId, limit = 200 }) => ({
        url: `/integrations/spotify/playlist/${playlistId}/tracks`,
        params: { limit },
      }),
    }),
  }),
});

export const {
  useGetSpotifyStatusQuery,
  useLazyGetSpotifyStatusQuery,
  useConnectSpotifyMutation,
  useDisconnectSpotifyMutation,
  useSearchSpotifyQuery,
  useLazySearchSpotifyQuery,
  useGetArtistTracksQuery,
  useLazyGetArtistTracksQuery,
  useGetPlaylistTracksQuery,
  useLazyGetPlaylistTracksQuery,
} = spotifyApi;