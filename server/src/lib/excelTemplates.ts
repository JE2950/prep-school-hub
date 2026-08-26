import ExcelJS from "exceljs";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF134EA1" },
};
const DATE_FORMAT = "dd/mm/yyyy";

function styleHeaderRow(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = HEADER_FILL;
  row.alignment = { vertical: "middle" };
}

function cellToString(value: ExcelJS.CellValue): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object" && "text" in (value as any)) return String((value as any).text).trim() || null;
  if (typeof value === "object" && "result" in (value as any)) return String((value as any).result ?? "").trim() || null;
  const s = String(value).trim();
  return s === "" ? null : s;
}

// Excel dates usually arrive as real Date objects when the cell is
// date-formatted; fall back to parsing a typed DD/MM/YYYY string so a
// pasted plain-text date still works.
function cellToUkDate(value: ExcelJS.CellValue): Date | null | "invalid" {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value;
  const s = cellToString(value);
  if (!s) return null;
  const match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return "invalid";
  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  if (month < 1 || month > 12 || day < 1 || day > 31) return "invalid";
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCMonth() !== month - 1) return "invalid"; // e.g. 31/02
  return date;
}

// ---------- Pupils ----------

const PUPIL_COLUMNS = [
  { header: "PupilID (leave blank for a new pupil)", key: "id", width: 26 },
  { header: "FirstName", key: "firstName", width: 16 },
  { header: "LastName", key: "lastName", width: 16 },
  { header: "DOB (DD/MM/YYYY)", key: "dob", width: 18 },
  { header: "TutorGroup", key: "tutorGroup", width: 16 },
  { header: "ParentName", key: "parentName", width: 20 },
  { header: "ParentEmail", key: "parentEmail", width: 26 },
  { header: "ParentEmail2", key: "parentEmail2", width: 26 },
  { header: "Notes", key: "notes", width: 30 },
];

export async function buildPupilsWorkbook(pupils: any[]): Promise<ExcelJS.Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Pupils");
  sheet.columns = PUPIL_COLUMNS;
  styleHeaderRow(sheet.getRow(1));

  for (const p of pupils) {
    const row = sheet.addRow({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      dob: p.dob ?? null,
      tutorGroup: p.tutorGroup?.name ?? "",
      parentName: p.parentName ?? "",
      parentEmail: p.parentEmail ?? "",
      parentEmail2: p.parentEmail2 ?? "",
      notes: p.notes ?? "",
    });
    if (p.dob) row.getCell("dob").numFmt = DATE_FORMAT;
  }

  if (pupils.length === 0) {
    const sample = sheet.addRow({
      id: "",
      firstName: "Alice",
      lastName: "Smith",
      dob: new Date(Date.UTC(2014, 4, 10)),
      tutorGroup: "7L",
      parentName: "Mrs J Smith",
      parentEmail: "j.smith@example.com",
      parentEmail2: "",
      notes: "Example row — delete before uploading",
    });
    sample.getCell("dob").numFmt = DATE_FORMAT;
    sample.font = { italic: true, color: { argb: "FF8794A1" } };
  }

  return wb.xlsx.writeBuffer();
}

export interface ParsedPupilRow {
  rowNumber: number;
  id: string | null;
  firstName: string | null;
  lastName: string | null;
  dob: Date | null | "invalid";
  tutorGroup: string | null;
  parentName: string | null;
  parentEmail: string | null;
  parentEmail2: string | null;
  notes: string | null;
}

export async function parsePupilsWorkbook(buffer: Buffer): Promise<ParsedPupilRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as any);
  const sheet = wb.worksheets[0];
  const rows: ParsedPupilRow[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // header
    const get = (col: number) => row.getCell(col).value;
    const firstName = cellToString(get(2));
    const lastName = cellToString(get(3));
    if (!firstName && !lastName) return; // blank row
    rows.push({
      rowNumber,
      id: cellToString(get(1)),
      firstName,
      lastName,
      dob: cellToUkDate(get(4)),
      tutorGroup: cellToString(get(5)),
      parentName: cellToString(get(6)),
      parentEmail: cellToString(get(7)),
      parentEmail2: cellToString(get(8)),
      notes: cellToString(get(9)),
    });
  });

  return rows;
}

// ---------- Terms ----------

const TERM_COLUMNS = [
  { header: "TermID (leave blank for a new term)", key: "id", width: 26 },
  { header: "Term (Michaelmas/Lent/Summer)", key: "term", width: 22 },
  { header: "AcademicYear (e.g. 2026/27)", key: "academicYear", width: 20 },
  { header: "StartDate (DD/MM/YYYY)", key: "startDate", width: 18 },
  { header: "EndDate (DD/MM/YYYY)", key: "endDate", width: 18 },
  { header: "HalfTermStart (DD/MM/YYYY)", key: "halfTermStart", width: 20 },
  { header: "HalfTermEnd (DD/MM/YYYY)", key: "halfTermEnd", width: 20 },
];

export async function buildTermsWorkbook(terms: any[]): Promise<ExcelJS.Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Term dates");
  sheet.columns = TERM_COLUMNS;
  styleHeaderRow(sheet.getRow(1));

  const dateCols = ["startDate", "endDate", "halfTermStart", "halfTermEnd"];

  for (const t of terms) {
    const row = sheet.addRow({
      id: t.id,
      term: t.name,
      academicYear: t.academicYear,
      startDate: t.startDate,
      endDate: t.endDate,
      halfTermStart: t.halfTermStart ?? null,
      halfTermEnd: t.halfTermEnd ?? null,
    });
    for (const c of dateCols) if (row.getCell(c).value) row.getCell(c).numFmt = DATE_FORMAT;
  }

  if (terms.length === 0) {
    const sample = sheet.addRow({
      id: "",
      term: "Michaelmas",
      academicYear: "2026/27",
      startDate: new Date(Date.UTC(2026, 8, 1)),
      endDate: new Date(Date.UTC(2026, 11, 15)),
      halfTermStart: new Date(Date.UTC(2026, 9, 24)),
      halfTermEnd: new Date(Date.UTC(2026, 10, 1)),
    });
    for (const c of dateCols) sample.getCell(c).numFmt = DATE_FORMAT;
    sample.font = { italic: true, color: { argb: "FF8794A1" } };
  }

  return wb.xlsx.writeBuffer();
}

export interface ParsedTermRow {
  rowNumber: number;
  id: string | null;
  term: string | null;
  academicYear: string | null;
  startDate: Date | null | "invalid";
  endDate: Date | null | "invalid";
  halfTermStart: Date | null | "invalid";
  halfTermEnd: Date | null | "invalid";
}

export async function parseTermsWorkbook(buffer: Buffer): Promise<ParsedTermRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as any);
  const sheet = wb.worksheets[0];
  const rows: ParsedTermRow[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const get = (col: number) => row.getCell(col).value;
    const term = cellToString(get(2));
    const academicYear = cellToString(get(3));
    if (!term && !academicYear) return;
    rows.push({
      rowNumber,
      id: cellToString(get(1)),
      term,
      academicYear,
      startDate: cellToUkDate(get(4)),
      endDate: cellToUkDate(get(5)),
      halfTermStart: cellToUkDate(get(6)),
      halfTermEnd: cellToUkDate(get(7)),
    });
  });

  return rows;
}

// ---------- Timetable ----------

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIMETABLE_COLUMNS = [
  { header: "SlotID (leave blank for a new slot)", key: "id", width: 26 },
  { header: "Day (Monday-Saturday)", key: "day", width: 16 },
  { header: "Week (A, B, or blank for every week)", key: "week", width: 24 },
  { header: "StartTime (HH:MM, 24hr)", key: "startTime", width: 18 },
  { header: "EndTime (HH:MM, 24hr)", key: "endTime", width: 18 },
  { header: "Class (must match an existing class exactly)", key: "className", width: 30 },
  { header: "Room", key: "room", width: 14 },
  { header: "Season (Winter/Summer, blank = Winter)", key: "season", width: 30 },
];

export async function buildTimetableWorkbook(slots: any[]): Promise<ExcelJS.Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Timetable");
  sheet.columns = TIMETABLE_COLUMNS;
  styleHeaderRow(sheet.getRow(1));
  // Force text formatting on time columns so Excel never "helpfully" turns
  // "09:00" into a time-serial number that reads back inconsistently.
  sheet.getColumn("startTime").numFmt = "@";
  sheet.getColumn("endTime").numFmt = "@";

  for (const s of slots) {
    sheet.addRow({
      id: s.id,
      day: DAY_NAMES[s.dayOfWeek] ?? "",
      week: s.week ?? "",
      startTime: s.startTime,
      endTime: s.endTime,
      className: s.class?.name ?? "",
      room: s.room ?? "",
      season: s.season === "summer" ? "Summer" : "Winter",
    });
  }

  if (slots.length === 0) {
    const sample = sheet.addRow({
      id: "",
      day: "Monday",
      week: "",
      startTime: "09:00",
      endTime: "09:40",
      className: "7L1",
      room: "L1",
      season: "Winter",
    });
    sample.font = { italic: true, color: { argb: "FF8794A1" } };
  }

  return wb.xlsx.writeBuffer();
}

export interface ParsedTimetableRow {
  rowNumber: number;
  id: string | null;
  day: string | null;
  week: string | null;
  startTime: string | null;
  endTime: string | null;
  className: string | null;
  room: string | null;
  season: string | null;
}

export async function parseTimetableWorkbook(buffer: Buffer): Promise<ParsedTimetableRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as any);
  const sheet = wb.worksheets[0];
  const rows: ParsedTimetableRow[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const get = (col: number) => row.getCell(col).value;
    const day = cellToString(get(2));
    const className = cellToString(get(6));
    if (!day && !className) return;
    rows.push({
      rowNumber,
      id: cellToString(get(1)),
      day,
      week: cellToString(get(3)),
      startTime: cellToString(get(4)),
      endTime: cellToString(get(5)),
      className,
      room: cellToString(get(7)),
      season: cellToString(get(8)),
    });
  });

  return rows;
}
