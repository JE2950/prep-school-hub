import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/nav-config", async (req, res) => {
  const config = await prisma.appConfig.findUnique({ where: { id: 1 } });
  const navConfig = (config?.navConfig as { order?: string[]; hidden?: string[] } | null) ?? {};
  res.json({ order: navConfig.order ?? null, hidden: navConfig.hidden ?? [] });
});

router.put("/nav-config", async (req, res) => {
  const { order, hidden } = req.body ?? {};
  if (!Array.isArray(order) || !Array.isArray(hidden)) {
    return res.status(400).json({ error: "order and hidden must be arrays." });
  }
  // The dashboard is always reachable — never let it be hidden, even by a stale request.
  const cleanedHidden = hidden.filter((h: unknown) => h !== "/");
  await prisma.appConfig.update({ where: { id: 1 }, data: { navConfig: { order, hidden: cleanedHidden } } });
  res.json({ ok: true });
});

router.get("/timetable-season", async (req, res) => {
  const config = await prisma.appConfig.findUnique({ where: { id: 1 } });
  res.json({ season: config?.activeTimetableSeason ?? "winter" });
});

router.put("/timetable-season", async (req, res) => {
  const { season } = req.body ?? {};
  if (season !== "winter" && season !== "summer") {
    return res.status(400).json({ error: "Season must be 'winter' or 'summer'." });
  }
  await prisma.appConfig.update({ where: { id: 1 }, data: { activeTimetableSeason: season } });
  res.json({ ok: true, season });
});

export default router;
