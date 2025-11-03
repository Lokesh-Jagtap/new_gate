import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import sapRoutes from "./routes/sapRoutes.js";
import { fileURLToPath } from "url";
import fs from "fs";

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load correct environment file
const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env.dev";
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
  console.log(`✅ Loaded environment: ${envFile}`);
} else {
  dotenv.config();
  console.log(`⚠️ Default .env loaded`);
}

const app = express();
const PORT = process.env.PORT;

// -----------------------------
// 🟢 CORS Configuration
// -----------------------------
// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL || "http://localhost:5173",
//     credentials: true,
//   })
// );

app.use(express.json());
app.use(cookieParser());

// -----------------------------
// 🟢 API Routes
// -----------------------------
app.use("/api", authRoutes);
app.use("/api", sapRoutes);


// -----------------------------
// 🟢 Serve React Build Files
// -----------------------------
const reactBuildPath = path.join(__dirname, "../reactUI/dist");
app.use("/web", express.static(reactBuildPath));

// -----------------------------
// 🟢 Fallback to React index.html (Express 5 safe)
// -----------------------------
app.get("/web/*", (req, res) => res.sendFile(path.join(reactBuildPath, "index.html")));

// -----------------------------
// 🟢 Start Server
// -----------------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}/web`);
});
