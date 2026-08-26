import ExcelJS from "exceljs";
import { PrismaClient } from "@prisma/client";

const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF134EA1" } };
const DATE_FORMAT = "dd/mm/yyyy";

function addSheet(
  wb: ExcelJS.Workbook,
  name: string,
  columns: { header: string; key: string; width?: number; date?: boolean }[],
  rows: Record<string, unknown>[]
) {
  const sheet = wb.addWorksheet(name.slice(0, 31)); // Excel sheet name limit
  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 20 }));
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = HEADER_FILL;
  for (const row of rows) {
    const added = sheet.addRow(row);
    for (const c of columns) {
      if (c.date && added.getCell(c.key).value) added.getCell(c.key).numFmt = DATE_FORMAT;
    }
  }
  if (rows.length === 0) sheet.addRow({});
}

export async function buildFullBackupWorkbook(prisma: PrismaClient): Promise<ExcelJS.Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Prep School Hub";
  wb.created = new Date();

  const [
    pupils,
    classes,
    slots,
    goals,
    sow,
    reflections,
    assessments,
    ceCandidates,
    coverFolders,
    duties,
    pastoralNotes,
    commsLog,
    teams,
    fixtures,
    kit,
    cpd,
    quals,
    milestones,
    contacts,
    procedures,
    terms,
    events,
    tasks,
    notes,
  ] = await Promise.all([
    prisma.pupil.findMany({
      where: { deletedAt: null },
      include: { tutorGroup: true, classes: { include: { class: true } }, teams: { include: { team: true } } },
    }),
    prisma.class.findMany({ where: { deletedAt: null }, include: { pupils: true } }),
    prisma.timetableSlot.findMany({ include: { class: true }, orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] }),
    prisma.termlyGoal.findMany({ where: { deletedAt: null } }),
    prisma.schemeOfWorkTopic.findMany({ include: { class: true }, orderBy: { order: "asc" } }),
    prisma.lessonReflection.findMany({ include: { class: true, topic: true } }),
    prisma.markAssessment.findMany({ include: { class: true, scores: { include: { pupil: true } } } }),
    prisma.cECandidate.findMany({ include: { pupil: true, results: true } }),
    prisma.coverFolder.findMany({ include: { class: true } }),
    prisma.dutyRotaEntry.findMany(),
    prisma.pastoralNote.findMany({ where: { deletedAt: null }, include: { pupil: true } }),
    prisma.parentCommunicationLog.findMany({ where: { deletedAt: null }, include: { pupil: true } }),
    prisma.team.findMany({ where: { deletedAt: null }, include: { pupils: true } }),
    prisma.fixture.findMany({ where: { deletedAt: null }, include: { team: true } }),
    prisma.kitChecklistItem.findMany({ include: { team: true } }),
    prisma.cPDEntry.findMany({ where: { deletedAt: null } }),
    prisma.qualification.findMany({ where: { deletedAt: null } }),
    prisma.careerMilestone.findMany({ where: { deletedAt: null } }),
    prisma.contact.findMany({ where: { deletedAt: null } }),
    prisma.procedureDoc.findMany({ where: { deletedAt: null } }),
    prisma.term.findMany({ where: { deletedAt: null } }),
    prisma.calendarEvent.findMany({ where: { deletedAt: null } }),
    prisma.task.findMany({ where: { deletedAt: null } }),
    prisma.note.findMany({ where: { deletedAt: null } }),
  ]);

  const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  addSheet(
    wb,
    "Pupils",
    [
      { header: "FirstName", key: "firstName" },
      { header: "LastName", key: "lastName" },
      { header: "DOB", key: "dob", date: true },
      { header: "TutorGroup", key: "tutorGroup" },
      { header: "ParentName", key: "parentName" },
      { header: "ParentEmail", key: "parentEmail", width: 26 },
      { header: "ParentEmail2", key: "parentEmail2", width: 26 },
      { header: "Notes", key: "notes", width: 30 },
      { header: "Classes", key: "classes", width: 26 },
      { header: "Teams", key: "teams", width: 26 },
    ],
    pupils.map((p) => ({
      firstName: p.firstName,
      lastName: p.lastName,
      dob: p.dob,
      tutorGroup: p.tutorGroup?.name ?? "",
      parentName: p.parentName ?? "",
      parentEmail: p.parentEmail ?? "",
      parentEmail2: p.parentEmail2 ?? "",
      notes: p.notes ?? "",
      classes: p.classes.map((c) => c.class.name).join(", "),
      teams: p.teams.map((t) => t.team.name).join(", "),
    }))
  );

  addSheet(
    wb,
    "Classes",
    [
      { header: "Name", key: "name" },
      { header: "Subject", key: "subject" },
      { header: "YearGroup", key: "yearGroup" },
      { header: "CurrentTopic", key: "currentTopic", width: 30 },
      { header: "Notes", key: "notes", width: 30 },
      { header: "PupilCount", key: "pupilCount" },
    ],
    classes.map((c) => ({
      name: c.name,
      subject: c.subject,
      yearGroup: c.yearGroup ?? "",
      currentTopic: c.currentTopic ?? "",
      notes: c.notes ?? "",
      pupilCount: c.pupils.length,
    }))
  );

  addSheet(
    wb,
    "Timetable",
    [
      { header: "Day", key: "day" },
      { header: "Week", key: "week" },
      { header: "Season", key: "season" },
      { header: "StartTime", key: "startTime" },
      { header: "EndTime", key: "endTime" },
      { header: "Class", key: "className" },
      { header: "Room", key: "room" },
    ],
    slots.map((s) => ({
      day: DAY_NAMES[s.dayOfWeek] ?? "",
      week: s.week ?? "",
      season: s.season === "summer" ? "Summer" : "Winter",
      startTime: s.startTime,
      endTime: s.endTime,
      className: s.class.name,
      room: s.room ?? "",
    }))
  );

  addSheet(
    wb,
    "Termly Goals",
    [
      { header: "Title", key: "title", width: 30 },
      { header: "Category", key: "category" },
      { header: "Term", key: "term" },
      { header: "AcademicYear", key: "academicYear" },
      { header: "Progress", key: "progress" },
      { header: "Status", key: "status" },
      { header: "Notes", key: "notes", width: 30 },
    ],
    goals.map((g) => ({
      title: g.title,
      category: g.category,
      term: g.term ?? "",
      academicYear: g.academicYear ?? "",
      progress: g.progress,
      status: g.status,
      notes: g.notes ?? "",
    }))
  );

  addSheet(
    wb,
    "Scheme of Work",
    [
      { header: "Class", key: "className" },
      { header: "Order", key: "order" },
      { header: "Title", key: "title", width: 30 },
      { header: "Status", key: "status" },
      { header: "Notes", key: "notes", width: 30 },
    ],
    sow.map((t) => ({ className: t.class.name, order: t.order, title: t.title, status: t.status, notes: t.notes ?? "" }))
  );

  addSheet(
    wb,
    "Lesson Reflections",
    [
      { header: "Class", key: "className" },
      { header: "Date", key: "date", date: true },
      { header: "Topic", key: "topic" },
      { header: "WhatWorked", key: "whatWorked", width: 30 },
      { header: "WhatDidnt", key: "whatDidnt", width: 30 },
      { header: "NextSteps", key: "nextSteps", width: 30 },
      { header: "Tags", key: "tags" },
    ],
    reflections.map((r) => ({
      className: r.class.name,
      date: r.date,
      topic: r.topic?.title ?? "",
      whatWorked: r.whatWorked ?? "",
      whatDidnt: r.whatDidnt ?? "",
      nextSteps: r.nextSteps ?? "",
      tags: r.tags ?? "",
    }))
  );

  const markbookRows: Record<string, unknown>[] = [];
  for (const a of assessments) {
    for (const s of a.scores) {
      markbookRows.push({
        className: a.class.name,
        assessment: a.title,
        type: a.type,
        date: a.date,
        maxScore: a.maxScore,
        pupil: `${s.pupil.firstName} ${s.pupil.lastName}`,
        score: s.score ?? "",
      });
    }
  }
  addSheet(
    wb,
    "Markbook",
    [
      { header: "Class", key: "className" },
      { header: "Assessment", key: "assessment", width: 26 },
      { header: "Type", key: "type" },
      { header: "Date", key: "date", date: true },
      { header: "MaxScore", key: "maxScore" },
      { header: "Pupil", key: "pupil" },
      { header: "Score", key: "score" },
    ],
    markbookRows
  );

  const ceRows: Record<string, unknown>[] = [];
  for (const c of ceCandidates) {
    for (const r of c.results) {
      ceRows.push({
        pupil: `${c.pupil.firstName} ${c.pupil.lastName}`,
        examBoard: c.examBoard ?? "",
        targetSchool: c.targetSchool ?? "",
        subject: r.subject,
        paper: r.paper ?? "",
        date: r.date,
        score: r.score ?? "",
        maxScore: r.maxScore,
        notes: r.notes ?? "",
      });
    }
  }
  addSheet(
    wb,
    "CE Scholarship Results",
    [
      { header: "Pupil", key: "pupil" },
      { header: "ExamBoard", key: "examBoard" },
      { header: "TargetSchool", key: "targetSchool", width: 24 },
      { header: "Subject", key: "subject" },
      { header: "Paper", key: "paper" },
      { header: "Date", key: "date", date: true },
      { header: "Score", key: "score" },
      { header: "MaxScore", key: "maxScore" },
      { header: "Notes", key: "notes", width: 26 },
    ],
    ceRows
  );

  addSheet(
    wb,
    "Cover Folders",
    [
      { header: "Class", key: "className" },
      { header: "StandingCoverLesson", key: "standing", width: 34 },
      { header: "SeatingNotes", key: "seating", width: 30 },
      { header: "PupilNotes", key: "pupilNotes", width: 30 },
    ],
    coverFolders.map((c) => ({
      className: c.class.name,
      standing: c.standingCoverLesson ?? "",
      seating: c.seatingNotes ?? "",
      pupilNotes: c.pupilNotes ?? "",
    }))
  );

  addSheet(
    wb,
    "Duty Rota",
    [
      { header: "Day", key: "day" },
      { header: "StartTime", key: "startTime" },
      { header: "EndTime", key: "endTime" },
      { header: "Type", key: "type" },
      { header: "Location", key: "location" },
      { header: "SpecificDate", key: "specificDate", date: true },
      { header: "Notes", key: "notes", width: 26 },
    ],
    duties.map((d) => ({
      day: DAY_NAMES[d.dayOfWeek] ?? "",
      startTime: d.startTime,
      endTime: d.endTime,
      type: d.type,
      location: d.location ?? "",
      specificDate: d.specificDate,
      notes: d.notes ?? "",
    }))
  );

  addSheet(
    wb,
    "Pastoral Notes",
    [
      { header: "Pupil", key: "pupil" },
      { header: "Date", key: "date", date: true },
      { header: "Note", key: "note", width: 40 },
    ],
    pastoralNotes.map((n) => ({ pupil: `${n.pupil.firstName} ${n.pupil.lastName}`, date: n.date, note: n.note }))
  );

  addSheet(
    wb,
    "Parent Communication",
    [
      { header: "Pupil", key: "pupil" },
      { header: "Date", key: "date", date: true },
      { header: "Method", key: "method" },
      { header: "Summary", key: "summary", width: 40 },
    ],
    commsLog.map((c) => ({ pupil: `${c.pupil.firstName} ${c.pupil.lastName}`, date: c.date, method: c.method, summary: c.summary }))
  );

  addSheet(
    wb,
    "Teams",
    [
      { header: "Name", key: "name" },
      { header: "Sport", key: "sport" },
      { header: "Season", key: "season" },
      { header: "SquadCount", key: "squadCount" },
    ],
    teams.map((t) => ({ name: t.name, sport: t.sport, season: t.season ?? "", squadCount: t.pupils.length }))
  );

  addSheet(
    wb,
    "Fixtures",
    [
      { header: "Team", key: "team" },
      { header: "Date", key: "date", date: true },
      { header: "Opponent", key: "opponent" },
      { header: "HomeAway", key: "homeAway" },
      { header: "Venue", key: "venue" },
      { header: "Result", key: "result" },
      { header: "Score", key: "score" },
      { header: "MatchReportDraft", key: "draft", width: 34 },
    ],
    fixtures.map((f) => ({
      team: f.team.name,
      date: f.date,
      opponent: f.opponent,
      homeAway: f.homeAway,
      venue: f.venue ?? "",
      result: f.result ?? "",
      score: f.scoreSummary ?? "",
      draft: f.matchReportDraft ?? "",
    }))
  );

  addSheet(
    wb,
    "Kit Checklist",
    [
      { header: "Team", key: "team" },
      { header: "Season", key: "season" },
      { header: "Item", key: "item" },
      { header: "Checked", key: "checked" },
    ],
    kit.map((k) => ({ team: k.team.name, season: k.season ?? "", item: k.item, checked: k.checked ? "Yes" : "No" }))
  );

  addSheet(
    wb,
    "CPD Log",
    [
      { header: "Title", key: "title", width: 30 },
      { header: "Provider", key: "provider" },
      { header: "Date", key: "date", date: true },
      { header: "Hours", key: "hours" },
      { header: "Reflection", key: "reflection", width: 34 },
      { header: "HasCertificate", key: "hasCert" },
    ],
    cpd.map((c) => ({
      title: c.title,
      provider: c.provider ?? "",
      date: c.date,
      hours: c.hours ?? "",
      reflection: c.reflection ?? "",
      hasCert: c.certificateFile ? "Yes" : "No",
    }))
  );

  addSheet(
    wb,
    "Qualifications",
    [
      { header: "Name", key: "name", width: 26 },
      { header: "IssuedDate", key: "issuedDate", date: true },
      { header: "ExpiryDate", key: "expiryDate", date: true },
      { header: "ReminderDays", key: "reminderDays" },
      { header: "Notes", key: "notes", width: 26 },
    ],
    quals.map((q) => ({
      name: q.name,
      issuedDate: q.issuedDate,
      expiryDate: q.expiryDate,
      reminderDays: q.reminderDays,
      notes: q.notes ?? "",
    }))
  );

  addSheet(
    wb,
    "Career Milestones",
    [
      { header: "Title", key: "title", width: 30 },
      { header: "Date", key: "date", date: true },
      { header: "Description", key: "description", width: 34 },
      { header: "HasEvidence", key: "hasEvidence" },
    ],
    milestones.map((m) => ({
      title: m.title,
      date: m.date,
      description: m.description ?? "",
      hasEvidence: m.evidenceFile ? "Yes" : "No",
    }))
  );

  addSheet(
    wb,
    "Contacts",
    [
      { header: "Name", key: "name" },
      { header: "Role", key: "role" },
      { header: "Type", key: "type" },
      { header: "Department", key: "department" },
      { header: "Phone", key: "phone" },
      { header: "Email", key: "email", width: 26 },
      { header: "CredentialsLocation", key: "credLocation", width: 24 },
      { header: "Notes", key: "notes", width: 26 },
    ],
    contacts.map((c) => ({
      name: c.name,
      role: c.role ?? "",
      type: c.type,
      department: c.department ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
      credLocation: c.credentialsLocation ?? "",
      notes: c.notes ?? "",
    }))
  );

  addSheet(
    wb,
    "Procedures",
    [
      { header: "Category", key: "category" },
      { header: "Title", key: "title", width: 26 },
      { header: "Content", key: "content", width: 50 },
    ],
    procedures.map((p) => ({ category: p.category, title: p.title, content: p.content }))
  );

  addSheet(
    wb,
    "Terms",
    [
      { header: "Term", key: "term" },
      { header: "AcademicYear", key: "academicYear" },
      { header: "StartDate", key: "startDate", date: true },
      { header: "EndDate", key: "endDate", date: true },
      { header: "HalfTermStart", key: "halfTermStart", date: true },
      { header: "HalfTermEnd", key: "halfTermEnd", date: true },
    ],
    terms.map((t) => ({
      term: t.name,
      academicYear: t.academicYear,
      startDate: t.startDate,
      endDate: t.endDate,
      halfTermStart: t.halfTermStart,
      halfTermEnd: t.halfTermEnd,
    }))
  );

  addSheet(
    wb,
    "Calendar Events",
    [
      { header: "Title", key: "title", width: 30 },
      { header: "Date", key: "date", date: true },
      { header: "EndDate", key: "endDate", date: true },
      { header: "Category", key: "category" },
      { header: "Type", key: "type" },
      { header: "Notes", key: "notes", width: 26 },
    ],
    events.map((e) => ({ title: e.title, date: e.date, endDate: e.endDate, category: e.category, type: e.type ?? "", notes: e.notes ?? "" }))
  );

  addSheet(
    wb,
    "Tasks",
    [
      { header: "Title", key: "title", width: 30 },
      { header: "DueDate", key: "dueDate", date: true },
      { header: "Done", key: "done" },
      { header: "Category", key: "category" },
    ],
    tasks.map((t) => ({ title: t.title, dueDate: t.dueDate, done: t.done ? "Yes" : "No", category: t.category ?? "" }))
  );

  addSheet(
    wb,
    "Notes",
    [
      { header: "Title", key: "title", width: 26 },
      { header: "Date", key: "date", date: true },
      { header: "Content", key: "content", width: 50 },
      { header: "Tags", key: "tags" },
    ],
    notes.map((n) => ({ title: n.title ?? "", date: n.date, content: n.content, tags: n.tags ?? "" }))
  );

  return wb.xlsx.writeBuffer();
}
