import { Router } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma";
import {
  buildPupilsWorkbook,
  buildTermsAndEventsWorkbook,
  buildTimetableWorkbook,
  parsePupilsWorkbook,
  parseTermsAndEventsWorkbook,
  parseTimetableWorkbook,
  ParsedPupilRow,
} from "../lib/excelTemplates";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const TERM_NAMES = ["Michaelmas", "Lent", "Summer"];
const DAY_NUMBERS: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

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

// ---------- Term dates & calendar events (one workbook, two tabs) ----------

const CALENDAR_CATEGORIES = ["academic", "sport", "pastoral", "admin", "personal"];

router.get("/term-calendar/template", async (req, res) => {
  const buffer = await buildTermsAndEventsWorkbook([], []);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="term-dates-and-calendar-template.xlsx"');
  res.send(Buffer.from(buffer));
});

router.get("/term-calendar/export", async (req, res) => {
  const [terms, events] = await Promise.all([
    prisma.term.findMany({ where: { deletedAt: null }, orderBy: { startDate: "asc" } }),
    prisma.calendarEvent.findMany({ where: { deletedAt: null }, orderBy: { date: "asc" } }),
  ]);
  const buffer = await buildTermsAndEventsWorkbook(terms, events);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="term-dates-and-calendar-export.xlsx"');
  res.send(Buffer.from(buffer));
});

router.post("/term-calendar", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });
  let parsed;
  try {
    parsed = await parseTermsAndEventsWorkbook(req.file.buffer);
  } catch {
    return res.status(400).json({ error: "Could not read that file — make sure it's the .xlsx template." });
  }

  const summary = { created: 0, updated: 0, errors: [] as { row: number; message: string }[] };

  for (const row of parsed.terms) {
    const canonicalTerm = TERM_NAMES.find((t) => t.toLowerCase() === (row.term ?? "").toLowerCase());
    if (!canonicalTerm) {
      summary.errors.push({ row: 0, message: `Term dates, row ${row.rowNumber}: term must be Michaelmas, Lent or Summer (got "${row.term ?? ""}").` });
      continue;
    }
    if (!row.academicYear) {
      summary.errors.push({ row: 0, message: `Term dates, row ${row.rowNumber}: academic year is required.` });
      continue;
    }
    if (row.startDate === "invalid" || row.endDate === "invalid" || row.halfTermStart === "invalid" || row.halfTermEnd === "invalid") {
      summary.errors.push({ row: 0, message: `Term dates, row ${row.rowNumber}: could not read a date — use DD/MM/YYYY.` });
      continue;
    }
    if (!row.startDate || !row.endDate) {
      summary.errors.push({ row: 0, message: `Term dates, row ${row.rowNumber}: start date and end date are required.` });
      continue;
    }

    const data = {
      name: canonicalTerm,
      academicYear: row.academicYear,
      startDate: row.startDate,
      endDate: row.endDate,
      halfTermStart: row.halfTermStart ?? null,
      halfTermEnd: row.halfTermEnd ?? null,
      startTimeLabel: row.startTimeLabel || null,
      endTimeLabel: row.endTimeLabel || null,
      halfTermStartTimeLabel: row.halfTermStartTimeLabel || null,
      halfTermEndTimeLabel: row.halfTermEndTimeLabel || null,
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

  for (const row of parsed.events) {
    if (!row.title) {
      summary.errors.push({ row: 0, message: `Calendar events, row ${row.rowNumber}: title is required.` });
      continue;
    }
    if (row.startDate === "invalid" || row.endDate === "invalid") {
      summary.errors.push({ row: 0, message: `Calendar events, row ${row.rowNumber}: could not read a date — use DD/MM/YYYY.` });
      continue;
    }
    if (!row.startDate) {
      summary.errors.push({ row: 0, message: `Calendar events, row ${row.rowNumber}: start date is required.` });
      continue;
    }
    const categoryRaw = (row.category ?? "").toLowerCase() || "pastoral"; // exeats etc. default to pastoral
    if (!CALENDAR_CATEGORIES.includes(categoryRaw)) {
      summary.errors.push({
        row: 0,
        message: `Calendar events, row ${row.rowNumber}: category must be one of ${CALENDAR_CATEGORIES.join(", ")} or blank (got "${row.category}").`,
      });
      continue;
    }

    const data = {
      title: row.title,
      category: categoryRaw,
      type: row.type?.trim() || null,
      date: row.startDate,
      startTimeLabel: row.startTimeLabel || null,
      endDate: row.endDate || null,
      endTimeLabel: row.endTimeLabel || null,
      notes: row.notes ?? null,
    };

    const existing = row.id ? await prisma.calendarEvent.findUnique({ where: { id: row.id } }) : null;
    if (existing) {
      await prisma.calendarEvent.update({ where: { id: existing.id }, data });
      summary.updated++;
    } else {
      await prisma.calendarEvent.create({ data });
      summary.created++;
    }
  }

  res.json(summary);
});

// ---------- Timetable ----------
// ---------- Timetable ----------

const TIME_FORMAT = /^([01]?\d|2[0-3]):([0-5]\d)$/;

router.get("/timetable/template", async (req, res) => {
  const buffer = await buildTimetableWorkbook([]);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="timetable-template.xlsx"');
  res.send(Buffer.from(buffer));
});

router.get("/timetable/export", async (req, res) => {
  const slots = await prisma.timetableSlot.findMany({
    include: { class: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  const buffer = await buildTimetableWorkbook(slots);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="timetable-export.xlsx"');
  res.send(Buffer.from(buffer));
});

router.post("/timetable", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });
  let rows;
  try {
    rows = await parseTimetableWorkbook(req.file.buffer);
  } catch {
    return res.status(400).json({ error: "Could not read that file — make sure it's the .xlsx template." });
  }

  const classes = await prisma.class.findMany();
  const classByName = new Map(classes.map((c) => [c.name.toLowerCase(), c.id]));

  const summary = {
    created: 0,
    updated: 0,
    classesCreated: [] as string[],
    errors: [] as { row: number; message: string }[],
  };

  for (const row of rows) {
    const dayNumber = DAY_NUMBERS[(row.day ?? "").toLowerCase()];
    if (!dayNumber) {
      summary.errors.push({ row: row.rowNumber, message: `Day must be Monday-Saturday (got "${row.day ?? ""}").` });
      continue;
    }
    if (!row.startTime || !TIME_FORMAT.test(row.startTime) || !row.endTime || !TIME_FORMAT.test(row.endTime)) {
      summary.errors.push({ row: row.rowNumber, message: "Start/end time must be in HH:MM 24-hour format." });
      continue;
    }
    const className = row.className?.trim();
    if (!className) {
      summary.errors.push({ row: row.rowNumber, message: "Class name is required." });
      continue;
    }
    // A class named in the timetable but not seen before is created on the fly —
    // with just a name, so it shows up right away for the teacher to fill in the
    // subject, year group etc. from the Classes page.
    let classId = classByName.get(className.toLowerCase());
    if (!classId) {
      const newClass = await prisma.class.create({ data: { name: className } });
      classId = newClass.id;
      classByName.set(className.toLowerCase(), classId);
      summary.classesCreated.push(className);
    }
    const week = row.week?.toUpperCase();
    if (week && week !== "A" && week !== "B") {
      summary.errors.push({ row: row.rowNumber, message: `Week must be A, B, or blank (got "${row.week}").` });
      continue;
    }
    const seasonRaw = (row.season ?? "").toLowerCase();
    if (seasonRaw && seasonRaw !== "winter" && seasonRaw !== "summer") {
      summary.errors.push({ row: row.rowNumber, message: `Season must be Winter, Summer, or blank (got "${row.season}").` });
      continue;
    }
    const season = seasonRaw === "summer" ? "summer" : "winter"; // blank defaults to winter

    const data = {
      dayOfWeek: dayNumber,
      week: week || null,
      startTime: row.startTime,
      endTime: row.endTime,
      classId,
      room: row.room ?? null,
      season,
    };

    const existing = row.id ? await prisma.timetableSlot.findUnique({ where: { id: row.id } }) : null;
    if (existing) {
      await prisma.timetableSlot.update({ where: { id: existing.id }, data });
      summary.updated++;
    } else {
      await prisma.timetableSlot.create({ data });
      summary.created++;
    }
  }

  res.json(summary);
});

export default router;
