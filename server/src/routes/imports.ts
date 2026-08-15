import { Router } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma";
import {
  buildPupilsWorkbook,
  buildTermsWorkbook,
  parsePupilsWorkbook,
  parseTermsWorkbook,
  ParsedPupilRow,
} from "../lib/excelTemplates";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const TERM_NAMES = ["Michaelmas", "Lent", "Summer"];

// ---------- Pupils ----------

router.get("/pupils/template", async (req, res) => {
  const buffer = await buildPupilsWorkbook([]);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="pupils-template.xlsx"');
  res.send(Buffer.from(buffer));
});

router.get("/pupils/export", async (req, res) => {
  const pupils = await prisma.pupil.findMany({ include: { tutorGroup: true }, orderBy: { lastName: "asc" } });
  const buffer = await buildPupilsWorkbook(pupils);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="pupils-export.xlsx"');
  res.send(Buffer.from(buffer));
});

interface ImportSummary {
  created: number;
  updated: number;
  linked: number;
  tutorGroupsCreated: string[];
  errors: { row: number; message: string }[];
}

async function importPupilRows(rows: ParsedPupilRow[], linkClassId?: string): Promise<ImportSummary> {
  const summary: ImportSummary = { created: 0, updated: 0, linked: 0, tutorGroupsCreated: [], errors: [] };

  const latestTerm = await prisma.term.findFirst({ orderBy: { startDate: "desc" } });
  const fallbackAcademicYear = latestTerm?.academicYear ?? "";
  const tutorGroupCache = new Map<string, string>(); // lowercase name -> id

  for (const row of rows) {
    if (!row.firstName || !row.lastName) {
      summary.errors.push({ row: row.rowNumber, message: "First and last name are both required." });
      continue;
    }
    if (row.dob === "invalid") {
      summary.errors.push({ row: row.rowNumber, message: `Could not read date of birth — use DD/MM/YYYY.` });
      continue;
    }

    let tutorGroupId: string | undefined;
    if (row.tutorGroup) {
      const key = row.tutorGroup.toLowerCase();
      if (tutorGroupCache.has(key)) {
        tutorGroupId = tutorGroupCache.get(key)!;
      } else {
        let tg = await prisma.tutorGroup.findFirst({ where: { name: { equals: row.tutorGroup, mode: "insensitive" } } });
        if (!tg) {
          tg = await prisma.tutorGroup.create({ data: { name: row.tutorGroup, academicYear: fallbackAcademicYear } });
          summary.tutorGroupsCreated.push(tg.name);
        }
        tutorGroupCache.set(key, tg.id);
        tutorGroupId = tg.id;
      }
    }

    const data = {
      firstName: row.firstName,
      lastName: row.lastName,
      dob: row.dob ?? null,
      tutorGroupId: tutorGroupId ?? null,
      parentName: row.parentName ?? null,
      parentEmail: row.parentEmail ?? null,
      parentEmail2: row.parentEmail2 ?? null,
      notes: row.notes ?? null,
    };

    let pupilId: string;
    const existing = row.id ? await prisma.pupil.findUnique({ where: { id: row.id } }) : null;
    if (existing) {
      const updated = await prisma.pupil.update({ where: { id: existing.id }, data });
      pupilId = updated.id;
      summary.updated++;
    } else {
      const created = await prisma.pupil.create({ data });
      pupilId = created.id;
      summary.created++;
    }

    if (linkClassId) {
      const link = await prisma.classPupil.findFirst({ where: { classId: linkClassId, pupilId } });
      if (!link) {
        await prisma.classPupil.create({ data: { classId: linkClassId, pupilId } });
        summary.linked++;
      }
    }
  }

  return summary;
}

router.post("/pupils", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });
  let rows: ParsedPupilRow[];
  try {
    rows = await parsePupilsWorkbook(req.file.buffer);
  } catch {
    return res.status(400).json({ error: "Could not read that file — make sure it's the .xlsx template." });
  }
  const summary = await importPupilRows(rows);
  res.json(summary);
});

// ---------- Class roster (bulk add pupils to one class) ----------

router.post("/class-roster/:classId", upload.single("file"), async (req, res) => {
  const cls = await prisma.class.findUnique({ where: { id: req.params.classId } });
  if (!cls) return res.status(404).json({ error: "Class not found." });
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });

  let rows: ParsedPupilRow[];
  try {
    rows = await parsePupilsWorkbook(req.file.buffer);
  } catch {
    return res.status(400).json({ error: "Could not read that file — make sure it's the .xlsx template." });
  }
  const summary = await importPupilRows(rows, req.params.classId);
  res.json(summary);
});

// ---------- Terms ----------

router.get("/terms/template", async (req, res) => {
  const buffer = await buildTermsWorkbook([]);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="term-dates-template.xlsx"');
  res.send(Buffer.from(buffer));
});

router.get("/terms/export", async (req, res) => {
  const terms = await prisma.term.findMany({ orderBy: { startDate: "asc" } });
  const buffer = await buildTermsWorkbook(terms);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="term-dates-export.xlsx"');
  res.send(Buffer.from(buffer));
});

router.post("/terms", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });
  let rows;
  try {
    rows = await parseTermsWorkbook(req.file.buffer);
  } catch {
    return res.status(400).json({ error: "Could not read that file — make sure it's the .xlsx template." });
  }

  const summary = { created: 0, updated: 0, errors: [] as { row: number; message: string }[] };

  for (const row of rows) {
    const canonicalTerm = TERM_NAMES.find((t) => t.toLowerCase() === (row.term ?? "").toLowerCase());
    if (!canonicalTerm) {
      summary.errors.push({ row: row.rowNumber, message: `Term must be Michaelmas, Lent or Summer (got "${row.term ?? ""}").` });
      continue;
    }
    if (!row.academicYear) {
      summary.errors.push({ row: row.rowNumber, message: "Academic year is required." });
      continue;
    }
    if (row.startDate === "invalid" || row.endDate === "invalid" || row.halfTermStart === "invalid" || row.halfTermEnd === "invalid") {
      summary.errors.push({ row: row.rowNumber, message: "Could not read a date — use DD/MM/YYYY." });
      continue;
    }
    if (!row.startDate || !row.endDate) {
      summary.errors.push({ row: row.rowNumber, message: "Start date and end date are required." });
      continue;
    }

    const data = {
      name: canonicalTerm,
      academicYear: row.academicYear,
      startDate: row.startDate,
      endDate: row.endDate,
      halfTermStart: row.halfTermStart ?? null,
      halfTermEnd: row.halfTermEnd ?? null,
    };

    const existing = row.id ? await prisma.term.findUnique({ where: { id: row.id } }) : null;
    if (existing) {
      await prisma.term.update({ where: { id: existing.id }, data });
      summary.updated++;
    } else {
      await prisma.term.create({ data });
      summary.created++;
    }
  }

  res.json(summary);
});

export default router;
