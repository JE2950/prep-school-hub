import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// Purge anything that's been in the bin for more than 30 days. Cheap to run
// on every list request rather than needing a separate cron job.
const RETENTION_DAYS = 30;

interface RecycleEntry {
  model: string;
  label: string;
  category: string;
  id: string;
  deletedAt: Date;
}

const REGISTRY: {
  model: keyof typeof prisma;
  category: string;
  label: (row: any) => string;
}[] = [
  { model: "pupil", category: "Pupil", label: (p) => `${p.firstName} ${p.lastName}` },
  { model: "class", category: "Class", label: (c) => `${c.name} (${c.subject})` },
  { model: "tutorGroup", category: "Tutor group", label: (t) => t.name },
  { model: "team", category: "Team", label: (t) => t.name },
  { model: "contact", category: "Contact", label: (c) => c.name },
  { model: "note", category: "Note", label: (n) => n.title || n.content.slice(0, 40) },
  { model: "termlyGoal", category: "Goal", label: (g) => g.title },
  { model: "cPDEntry", category: "CPD entry", label: (c) => c.title },
  { model: "qualification", category: "Qualification", label: (q) => q.name },
  { model: "careerMilestone", category: "Career milestone", label: (m) => m.title },
  { model: "procedureDoc", category: "Procedure", label: (p) => p.title },
  { model: "fixture", category: "Fixture", label: (f) => `vs ${f.opponent}` },
  { model: "term", category: "Term", label: (t) => `${t.name} ${t.academicYear}` },
  { model: "calendarEvent", category: "Calendar entry", label: (e) => e.title },
  { model: "pastoralNote", category: "Pastoral note", label: (p) => p.note.slice(0, 40) },
  { model: "parentCommunicationLog", category: "Parent communication", label: (c) => c.summary.slice(0, 40) },
  { model: "task", category: "Task", label: (t) => t.title },
];

function delegateFor(model: keyof typeof prisma) {
  return prisma[model] as any;
}

router.get("/", async (req, res) => {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  // Lazy purge of anything past retention — avoids needing a cron job.
  await Promise.all(
    REGISTRY.map(({ model }) =>
      delegateFor(model).deleteMany({ where: { deletedAt: { lt: cutoff } } }).catch(() => null)
    )
  );

  const results = await Promise.all(
    REGISTRY.map(async ({ model, category, label }) => {
      const rows = await delegateFor(model).findMany({
        where: { deletedAt: { not: null } },
        orderBy: { deletedAt: "desc" },
        take: 50,
      });
      return rows.map(
        (row: any): RecycleEntry => ({
          model: model as string,
          category,
          label: label(row),
          id: row.id,
          deletedAt: row.deletedAt,
        })
      );
    })
  );

  const entries = results.flat().sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());
  res.json({ entries, retentionDays: RETENTION_DAYS });
});

router.post("/:model/:id/restore", async (req, res) => {
  const entry = REGISTRY.find((e) => e.model === req.params.model);
  if (!entry) return res.status(400).json({ error: "Unknown item type." });
  try {
    await delegateFor(entry.model).update({ where: { id: req.params.id }, data: { deletedAt: null } });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message ?? "Could not restore." });
  }
});

router.delete("/:model/:id", async (req, res) => {
  const entry = REGISTRY.find((e) => e.model === req.params.model);
  if (!entry) return res.status(400).json({ error: "Unknown item type." });
  try {
    await delegateFor(entry.model).delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e: any) {
    res.status(400).json({ error: e.message ?? "Could not permanently delete." });
  }
});

export default router;
