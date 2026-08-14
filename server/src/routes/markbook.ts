import { Router } from "express";
import { prisma } from "../lib/prisma";
import { toCsv } from "../lib/csv";

const router = Router();

const FLAG_THRESHOLD = 0.5; // below 50% of max score is flagged red

function flagFor(pct: number | null): "green" | "amber" | "red" | "none" {
  if (pct === null) return "none";
  if (pct < FLAG_THRESHOLD) return "red";
  if (pct < 0.65) return "amber";
  return "green";
}

// GET /api/markbook/:classId — assessments + per-pupil averages & flags
router.get("/:classId", async (req, res) => {
  const { classId } = req.params;

  const [pupilsInClass, assessments] = await Promise.all([
    prisma.classPupil.findMany({
      where: { classId },
      include: { pupil: true },
    }),
    prisma.markAssessment.findMany({
      where: { classId },
      include: { scores: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const rows = pupilsInClass.map(({ pupil }) => {
    const perAssessment = assessments.map((a) => {
      const score = a.scores.find((s) => s.pupilId === pupil.id)?.score ?? null;
      const pct = score === null ? null : score / a.maxScore;
      return { assessmentId: a.id, score, pct };
    });
    const validPcts = perAssessment.map((p) => p.pct).filter((p): p is number => p !== null);
    const averagePct = validPcts.length
      ? validPcts.reduce((sum, p) => sum + p, 0) / validPcts.length
      : null;

    return {
      pupilId: pupil.id,
      pupilName: `${pupil.firstName} ${pupil.lastName}`,
      scores: perAssessment,
      averagePct,
      flag: flagFor(averagePct),
    };
  });

  res.json({ assessments, rows });
});

// PUT /api/markbook/score — upsert a single pupil's score for an assessment
router.put("/score", async (req, res) => {
  const { assessmentId, pupilId, score } = req.body ?? {};
  if (!assessmentId || !pupilId) {
    return res.status(400).json({ error: "assessmentId and pupilId are required." });
  }
  const result = await prisma.markScore.upsert({
    where: { assessmentId_pupilId: { assessmentId, pupilId } },
    create: { assessmentId, pupilId, score: score === "" || score === undefined ? null : Number(score) },
    update: { score: score === "" || score === undefined ? null : Number(score) },
  });
  res.json(result);
});

// GET /api/markbook/:classId/export.csv
router.get("/:classId/export.csv", async (req, res) => {
  const { classId } = req.params;
  const [pupilsInClass, assessments] = await Promise.all([
    prisma.classPupil.findMany({ where: { classId }, include: { pupil: true } }),
    prisma.markAssessment.findMany({ where: { classId }, include: { scores: true }, orderBy: { date: "asc" } }),
  ]);

  const columns = [
    { key: "pupilName", header: "Pupil" },
    ...assessments.map((a) => ({ key: a.id, header: `${a.title} (${a.type})` })),
    { key: "average", header: "Average %" },
  ];

  const rows = pupilsInClass.map(({ pupil }) => {
    const row: Record<string, unknown> = { pupilName: `${pupil.firstName} ${pupil.lastName}` };
    const pcts: number[] = [];
    for (const a of assessments) {
      const score = a.scores.find((s) => s.pupilId === pupil.id)?.score ?? null;
      row[a.id] = score ?? "";
      if (score !== null) pcts.push(score / a.maxScore);
    }
    row.average = pcts.length ? `${Math.round((pcts.reduce((s, p) => s + p, 0) / pcts.length) * 100)}%` : "";
    return row;
  });

  const csv = toCsv(rows, columns);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="markbook-${classId}.csv"`);
  res.send(csv);
});

export default router;
