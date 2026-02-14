import mongoose, { Schema, Document } from "mongoose";
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = "aes-256-cbc";

export interface ISpotifyConnection extends Document {
  userId: mongoose.Types.ObjectId;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string;
  spotifyUserId: string;
  spotifyEmail?: string;
  spotifyDisplayName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  encrypt(text: string): string;
  decrypt(text: string): string;
  isExpired(): boolean;
  getDecryptedAccessToken(): string;
  getDecryptedRefreshToken(): string;
}

const SpotifyConnectionSchema = new Schema<ISpotifyConnection>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    scope: { type: String, required: true },
    spotifyUserId: { type: String, required: true },
    spotifyEmail: { type: String },
    spotifyDisplayName: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SpotifyConnectionSchema.pre<ISpotifyConnection>("save", function () {
  const isEncrypted = (token: string): boolean => {
    if (!token.includes(":")) return false;
    const [ivHex] = token.split(":");
    return ivHex.length === 32 && /^[0-9a-f]{32}$/i.test(ivHex);
  };

  if (this.isModified("accessToken") && !isEncrypted(this.accessToken)) {
    console.log("[Spotify] Encrypting access token");
    this.accessToken = this.encrypt(this.accessToken);
  }
  
  if (this.isModified("refreshToken") && !isEncrypted(this.refreshToken)) {
    console.log("[Spotify] Encrypting refresh token");
    this.refreshToken = this.encrypt(this.refreshToken);
  }
});

SpotifyConnectionSchema.methods.decrypt = function (text: string): string {
  if (!text.includes(":")) {
    console.error("[Spotify] Token is not encrypted or has invalid format");
    throw new Error("Invalid encrypted token format");
  }

  const parts = text.split(":");
  if (parts.length !== 2) {
    console.error("[Spotify] Token has invalid format, expected 'iv:encrypted'");
    throw new Error("Invalid encrypted token format - missing IV or encrypted text");
  }

  const [ivHex, encryptedText] = parts;
  
  if (ivHex.length !== 32) {
    console.error(`[Spotify] Invalid IV length: ${ivHex.length}, expected 32`);
    throw new Error(`Invalid IV length: ${ivHex.length}`);
  }

  try {
    const iv = Buffer.from(ivHex, "hex");
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("[Spotify] Decryption failed:", error);
    throw error;
  }
};

SpotifyConnectionSchema.methods.decrypt = function (text: string): string {
  const [ivHex, encryptedText] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

SpotifyConnectionSchema.methods.isExpired = function (): boolean {
  return new Date() >= this.expiresAt;
};

SpotifyConnectionSchema.methods.getDecryptedAccessToken = function (): string {
  return this.decrypt(this.accessToken);
};

SpotifyConnectionSchema.methods.getDecryptedRefreshToken = function (): string {
  return this.decrypt(this.refreshToken);
};

export const SpotifyConnectionModel = mongoose.model<ISpotifyConnection>(
  "SpotifyConnection",
  SpotifyConnectionSchema
);