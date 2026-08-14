import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

import authRoutes from "./routes/auth";
import resourceRoutes from "./routes/resources";
import dashboardRoutes from "./routes/dashboard";
import coverSheetRoutes from "./routes/coverSheet";
import searchRoutes from "./routes/search";
import markbookRoutes from "./routes/markbook";
import exportRoutes from "./routes/exports";
import aiPromptRoutes from "./routes/aiPrompts";
import uploadRoutes from "./routes/uploads";
import { requireAuth } from "./lib/requireAuth";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api/auth", authRoutes);
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Everything below requires an authenticated session
app.use("/api/dashboard", requireAuth, dashboardRoutes);
app.use("/api/cover-sheet", requireAuth, coverSheetRoutes);
app.use("/api/search", requireAuth, searchRoutes);
app.use("/api/markbook", requireAuth, markbookRoutes);
app.use("/api/exports", requireAuth, exportRoutes);
app.use("/api/ai-prompts", requireAuth, aiPromptRoutes);
app.use("/api/uploads", requireAuth, uploadRoutes);
app.use("/api", requireAuth, resourceRoutes);

app.listen(PORT, () => {
  console.log(`Prep School Hub API listening on http://localhost:${PORT}`);
});
