import { Router } from "express";
import { prisma } from "../lib/prisma";
import { toCsv } from "../lib/csv";
import { buildFullBackupWorkbook } from "../lib/backup";

const router = Router();

router.get("/backup.xlsx", async (req, res) => {
  const buffer = await buildFullBackupWorkbook(prisma);
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="prep-school-hub-backup-${stamp}.xlsx"`);
  res.send(Buffer.from(buffer));
});

router.get("/cpd.csv", async (req, res) => {
  const entries = await prisma.cPDEntry.findMany({ where: { deletedAt: null }, orderBy: { date: "desc" } });
  const csv = toCsv(
    entries.map((e) => ({
      ...e,
      date: e.date.toISOString().slice(0, 10),
    })),
    [
      { key: "title", header: "Title" },
      { key: "provider", header: "Provider" },
      { key: "date", header: "Date" },
      { key: "hours", header: "Hours" },
      { key: "reflection", header: "Reflection" },
    ]
  );
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="cpd-log.csv"');
  res.send(csv);
});

// One combined "tutoring records" export: tutor group roster + pastoral notes + comms log
router.get("/tutoring.csv", async (req, res) => {
  const [notes, comms] = await Promise.all([
    prisma.pastoralNote.findMany({ where: { deletedAt: null }, include: { pupil: true }, orderBy: { date: "desc" } }),
    prisma.parentCommunicationLog.findMany({ where: { deletedAt: null }, include: { pupil: true }, orderBy: { date: "desc" } }),
  ]);

  const rows = [
    ...notes.map((n) => ({
      type: "Pastoral note",
      pupil: `${n.pupil.firstName} ${n.pupil.lastName}`,
      date: n.date.toISOString().slice(0, 10),
      method: "",
      detail: n.note,
    })),
    ...comms.map((c) => ({
      type: "Parent communication",
      pupil: `${c.pupil.firstName} ${c.pupil.lastName}`,
      date: c.date.toISOString().slice(0, 10),
      method: c.method,
      detail: c.summary,
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  const csv = toCsv(rows, [
    { key: "type", header: "Type" },
    { key: "pupil", header: "Pupil" },
    { key: "date", header: "Date" },
    { key: "method", header: "Method" },
    { key: "detail", header: "Detail" },
  ]);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="tutoring-records.csv"');
  res.send(csv);
});

export default router;
