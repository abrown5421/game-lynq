import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db";
import userRoutes from "./routes/users.routes";
import authRoutes from "./routes/auth.routes";
import sessionRoutes from "./routes/sessions.routes";
import cookieParser from "cookie-parser";
import integrationsRoutes from "./integrations/routes/integrations.routes";

dotenv.config();

const app = express();

console.log("CLIENT_URL:", process.env.CLIENT_URL);
console.log("NODE_ENV:", process.env.NODE_ENV);

const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5173",
].filter(Boolean);

console.log("Allowed origins:", allowedOrigins);

const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) {
    console.log("Request from origin:", origin);

    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("Origin not allowed:", origin);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Set-Cookie"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/integrations", integrationsRoutes);
app.use("/api/sessions", sessionRoutes);
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
