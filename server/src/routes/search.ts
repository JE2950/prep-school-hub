import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// GET /api/search?q=term — searches across notes, reflections, pastoral notes,
// comms log and CPD reflections. Grouped by type for the client to render.
router.get("/", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  if (!q) return res.json({ notes: [], reflections: [], pastoralNotes: [], commsLog: [], cpdEntries: [] });

  const contains = { contains: q };

  const [notes, reflections, pastoralNotes, commsLog, cpdEntries] = await Promise.all([
    prisma.note.findMany({
      where: { deletedAt: null, OR: [{ title: contains }, { content: contains }, { tags: contains }] },
      orderBy: { date: "desc" },
      take: 15,
    }),
    prisma.lessonReflection.findMany({
      where: {
        OR: [{ whatWorked: contains }, { whatDidnt: contains }, { nextSteps: contains }, { tags: contains }],
      },
      include: { class: true },
      orderBy: { date: "desc" },
      take: 15,
    }),
    prisma.pastoralNote.findMany({
      where: { deletedAt: null, note: contains },
      include: { pupil: true },
      orderBy: { date: "desc" },
      take: 15,
    }),
    prisma.parentCommunicationLog.findMany({
      where: { deletedAt: null, summary: contains },
      include: { pupil: true },
      orderBy: { date: "desc" },
      take: 15,
    }),
    prisma.cPDEntry.findMany({
      where: { deletedAt: null, OR: [{ title: contains }, { reflection: contains }] },
      orderBy: { date: "desc" },
      take: 15,
    }),
  ]);

  res.json({ notes, reflections, pastoralNotes, commsLog, cpdEntries });
});

export default router;
