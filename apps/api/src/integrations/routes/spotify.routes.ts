import { Router } from "express";
import { IntegrationManager } from "../core/integration-manager";
import { SpotifyProvider } from "../providers/spotify.provider";
import { SpotifyConnectionModel } from "../../entities/spotify-connection/spotify-connection.model";
import { verifyToken } from "../../shared/jwt";
import crypto from "crypto";

const router = Router();

const pendingStates = new Map<string, { userId: string; timestamp: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [state, data] of pendingStates.entries()) {
    if (now - data.timestamp > 10 * 60 * 1000) {
      pendingStates.delete(state);
    }
  }
}, 10 * 60 * 1000);

router.get("/connect", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const state = crypto.randomBytes(16).toString("hex");
    pendingStates.set(state, {
      userId: decoded.userId,
      timestamp: Date.now(),
    });

    const manager = IntegrationManager.getInstance();
    const spotify = manager.get<SpotifyProvider>("spotify");

    if (!spotify) {
      return res.status(500).json({ error: "Spotify integration not available" });
    }

    const authUrl = spotify.getAuthorizationUrl(state);
    res.json({ authUrl });
  } catch (error: any) {
    console.error("[Spotify OAuth] Connect error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/callback", async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${process.env.CLIENT_URL}/settings?spotify_error=${error}`);
    }

    if (!code || !state) {
      return res.redirect(`${process.env.CLIENT_URL}/settings?spotify_error=missing_params`);
    }

    const stateData = pendingStates.get(state as string);
    if (!stateData) {
      return res.redirect(`${process.env.CLIENT_URL}/settings?spotify_error=invalid_state`);
    }

    pendingStates.delete(state as string);
    const manager = IntegrationManager.getInstance();
    const spotify = manager.get<SpotifyProvider>("spotify");

    if (!spotify) {
      return res.redirect(`${process.env.CLIENT_URL}/settings?spotify_error=provider_unavailable`);
    }

    const tokenResult = await spotify.exchangeCodeForTokens(code as string);
    if (!tokenResult.success || !tokenResult.data) {
      return res.redirect(`${process.env.CLIENT_URL}/settings?spotify_error=token_exchange_failed`);
    }

    const tokens = tokenResult.data;

    const userResult = await spotify.getCurrentUser(tokens.access_token);
    if (!userResult.success || !userResult.data) {
      return res.redirect(`${process.env.CLIENT_URL}/settings?spotify_error=profile_fetch_failed`);
    }

    const spotifyUser = userResult.data;

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await SpotifyConnectionModel.findOneAndUpdate(
      { userId: stateData.userId },
      {
        userId: stateData.userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: expiresAt,
        scope: tokens.scope,
        spotifyUserId: spotifyUser.id,
        spotifyEmail: spotifyUser.email,
        spotifyDisplayName: spotifyUser.display_name,
        isActive: true,
      },
      { upsert: true, new: true }
    );

    res.redirect(`${process.env.CLIENT_URL}/settings?spotify_connected=true`);
  } catch (error: any) {
    console.error("[Spotify OAuth] Callback error:", error);
    res.redirect(`${process.env.CLIENT_URL}/settings?spotify_error=unknown`);
  }
});

router.get("/status", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const connection = await SpotifyConnectionModel.findOne({
      userId: decoded.userId,
      isActive: true,
    });

    if (!connection) {
      return res.json({ connected: false });
    }

    res.json({
      connected: true,
      spotifyDisplayName: connection.spotifyDisplayName,
      spotifyEmail: connection.spotifyEmail,
      expiresAt: connection.expiresAt,
    });
  } catch (error: any) {
    console.error("[Spotify] Status check error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/disconnect", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }

    await SpotifyConnectionModel.findOneAndUpdate(
      { userId: decoded.userId },
      { isActive: false }
    );

    res.json({ success: true, message: "Spotify account disconnected" });
  } catch (error: any) {
    console.error("[Spotify] Disconnect error:", error);
    res.status(500).json({ error: error.message });
  }
});

export async function getValidAccessToken(userId: string): Promise<string | null> {
  try {
    const connection = await SpotifyConnectionModel.findOne({
      userId,
      isActive: true,
    });

    if (!connection) {
      return null;
    }

    if (!connection.isExpired()) {
      return connection.getDecryptedAccessToken(); //Property 'getDecryptedAccessToken' does not exist on type 'Document<unknown, {}, ISpotifyConnection, {}, DefaultSchemaOptions> & ISpotifyConnection & Required<{ _id: ObjectId; }> & { ...; } & { ...; }'.
    }

    const manager = IntegrationManager.getInstance();
    const spotify = manager.get<SpotifyProvider>("spotify");

    if (!spotify) {
      return null;
    }

    const refreshToken = connection.getDecryptedRefreshToken(); //Property 'getDecryptedRefreshToken' does not exist on type 'Document<unknown, {}, ISpotifyConnection, {}, DefaultSchemaOptions> & ISpotifyConnection & Required<{ _id: ObjectId; }> & { ...; } & { ...; }'.
    const refreshResult = await spotify.refreshAccessToken(refreshToken);

    if (!refreshResult.success || !refreshResult.data) {
      connection.isActive = false;
      await connection.save();
      return null;
    }

    const newTokens = refreshResult.data;
    connection.accessToken = newTokens.access_token;
    if (newTokens.refresh_token) {
      connection.refreshToken = newTokens.refresh_token;
    }
    connection.expiresAt = new Date(Date.now() + newTokens.expires_in * 1000);
    await connection.save();

    return newTokens.access_token;
  } catch (error) {
    console.error("[Spotify] Token refresh error:", error);
    return null;
  }
}

export default router;