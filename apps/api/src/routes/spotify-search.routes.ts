import { Router } from "express";
import { verifyToken } from "../shared/jwt";
import { getValidAccessToken } from "../integrations/routes/spotify.routes";
import { IntegrationManager } from "../integrations/core/integration-manager";
import { SpotifyProvider } from "../integrations/providers/spotify.provider";
const router = Router();

router.get("/search", async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const accessToken = await getValidAccessToken(decoded.userId);
    if (!accessToken) {
      return res.status(401).json({ 
        error: "Spotify not connected or token expired. Please reconnect." 
      });
    }
    const manager = IntegrationManager.getInstance();
    const spotify = manager.get<SpotifyProvider>("spotify");

    if (!spotify) {
      return res.status(500).json({ error: "Spotify provider not available" });
    }
    const searchResult = await spotify.search(
      query as string,
      accessToken,
      ["artist", "playlist"],
      Number(limit)
    );

    if (!searchResult.success) {
      return res.status(500).json({ error: searchResult.error });
    }

    res.json({
      artists: searchResult.data?.artists?.items || [],
      playlists: searchResult.data?.playlists?.items || [],
    });
  } catch (error: any) {
    console.error("[Spotify Search] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/artist/:artistId/tracks", async (req, res) => {
  try {
    const { artistId } = req.params;
    const { limit = 200 } = req.query;

    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const accessToken = await getValidAccessToken(decoded.userId);
    if (!accessToken) {
      return res.status(401).json({ 
        error: "Spotify not connected or token expired. Please reconnect." 
      });
    }
    const manager = IntegrationManager.getInstance();
    const spotify = manager.get<SpotifyProvider>("spotify");

    if (!spotify) {
      return res.status(500).json({ error: "Spotify provider not available" });
    }
    const tracksResult = await spotify.getArtistDiscography(
      artistId,
      accessToken,
      Number(limit)
    );

    if (!tracksResult.success) {
      return res.status(500).json({ error: tracksResult.error });
    }
    const tracks = (tracksResult.data || []).map((track: any) => ({
      name: track.name,
      artist: track.artists.map((a: any) => a.name).join(", "),
      previewUrl: track.preview_url,
      artwork: track.album.images[0]?.url || "",
    }));

    res.json({ tracks });
  } catch (error: any) {
    console.error("[Spotify Artist Tracks] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/playlist/:playlistId/tracks", async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { limit = 200 } = req.query;

    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(decoded.userId);
    if (!accessToken) {
      return res.status(401).json({ 
        error: "Spotify not connected or token expired. Please reconnect." 
      });
    }

    // Get Spotify provider
    const manager = IntegrationManager.getInstance();
    const spotify = manager.get<SpotifyProvider>("spotify");

    if (!spotify) {
      return res.status(500).json({ error: "Spotify provider not available" });
    }

    // Get playlist tracks
    const tracksResult = await spotify.getPlaylistTracks(
      playlistId,
      accessToken,
      Number(limit)
    );

    if (!tracksResult.success) {
      return res.status(500).json({ error: tracksResult.error });
    }

    // Transform Spotify tracks to our Track format
    const tracks = (tracksResult.data || []).map((track: any) => ({
      name: track.name,
      artist: track.artists.map((a: any) => a.name).join(", "),
      previewUrl: track.preview_url,
      artwork: track.album.images[0]?.url || "",
    }));

    res.json({ tracks });
  } catch (error: any) {
    console.error("[Spotify Playlist Tracks] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;