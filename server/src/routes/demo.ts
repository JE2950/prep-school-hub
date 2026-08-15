import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// Every non-config table, used by the wipe endpoint. Listed explicitly
// (rather than derived) so a schema change can't silently wipe more or
// less than intended.
const ALL_DATA_TABLES = [
  "Term",
  "CalendarEvent",
  "TutorGroup",
  "Pupil",
  "Class",
  "ClassPupil",
  "TimetableSlot",
  "TermlyGoal",
  "SchemeOfWorkTopic",
  "LessonReflection",
  "MarkAssessment",
  "MarkScore",
  "CECandidate",
  "CEPracticeResult",
  "CoverFolder",
  "DutyRotaEntry",
  "PastoralNote",
  "ParentCommunicationLog",
  "Team",
  "TeamPupil",
  "TrainingSession",
  "Fixture",
  "KitChecklistItem",
  "CPDEntry",
  "Qualification",
  "CareerMilestone",
  "Contact",
  "ProcedureDoc",
  "Task",
  "Note",
];

router.post("/wipe-all-data", async (req, res) => {
  const { confirm } = req.body ?? {};
  if (confirm !== "DELETE EVERYTHING") {
    return res.status(400).json({ error: 'Type "DELETE EVERYTHING" exactly to confirm.' });
  }
  const quoted = ALL_DATA_TABLES.map((t) => `"${t}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE;`);
  res.json({ ok: true });
});

router.post("/load-sample-data", async (req, res) => {
  const now = new Date();
  const year = now.getFullYear();

  const term = await prisma.term.create({
    data: {
      name: "Michaelmas",
      academicYear: `${year}/${String(year + 1).slice(2)}`,
      startDate: new Date(Date.UTC(year, 8, 1)),
      endDate: new Date(Date.UTC(year, 11, 15)),
      halfTermStart: new Date(Date.UTC(year, 9, 24)),
      halfTermEnd: new Date(Date.UTC(year, 10, 1)),
    },
  });

  const tutorGroup = await prisma.tutorGroup.create({ data: { name: "7L", academicYear: term.academicYear } });

  const classLatin = await prisma.class.create({
    data: { name: "7L1", subject: "Latin", yearGroup: "7", currentTopic: "Present tense verbs" },
  });
  const classFrench = await prisma.class.create({
    data: { name: "7F2", subject: "French", yearGroup: "7", currentTopic: "Family vocabulary" },
  });

  const demoPupils = [
    { firstName: "Isla", lastName: "Fletcher", dob: new Date(Date.UTC(year - 12, 3, 14)), parentName: "Mrs R Fletcher", parentEmail: "r.fletcher@example.com" },
    { firstName: "Oscar", lastName: "Whitfield", dob: new Date(Date.UTC(year - 12, 7, 2)), parentName: "Mr J Whitfield", parentEmail: "j.whitfield@example.com" },
    { firstName: "Freya", lastName: "Ashworth", dob: new Date(Date.UTC(year - 11, 11, 9)), parentName: "Dr S Ashworth", parentEmail: "s.ashworth@example.com" },
    { firstName: "Theo", lastName: "Radcliffe", dob: new Date(Date.UTC(year - 12, 1, 21)), parentName: "Mrs L Radcliffe", parentEmail: "l.radcliffe@example.com" },
    { firstName: "Poppy", lastName: "Sinclair", dob: new Date(Date.UTC(year - 11, 5, 30)), parentName: "Mr T Sinclair", parentEmail: "t.sinclair@example.com" },
    { firstName: "Hugo", lastName: "Bancroft", dob: new Date(Date.UTC(year - 12, 9, 17)), parentName: "Mrs A Bancroft", parentEmail: "a.bancroft@example.com" },
    { firstName: "Matilda", lastName: "Hartley", dob: new Date(Date.UTC(year - 11, 2, 5)), parentName: "Mr D Hartley", parentEmail: "d.hartley@example.com" },
    { firstName: "Arthur", lastName: "Pemberton", dob: new Date(Date.UTC(year - 12, 6, 26)), parentName: "Mrs K Pemberton", parentEmail: "k.pemberton@example.com" },
  ];

  const pupils = [];
  for (const p of demoPupils) {
    pupils.push(await prisma.pupil.create({ data: { ...p, tutorGroupId: tutorGroup.id } }));
  }

  for (const pupil of pupils) {
    await prisma.classPupil.create({ data: { classId: classLatin.id, pupilId: pupil.id } });
  }
  for (const pupil of pupils.slice(0, 5)) {
    await prisma.classPupil.create({ data: { classId: classFrench.id, pupilId: pupil.id } });
  }

  await prisma.timetableSlot.createMany({
    data: [
      { classId: classLatin.id, dayOfWeek: 1, startTime: "09:00", endTime: "09:40", room: "L1" },
      { classId: classLatin.id, dayOfWeek: 3, startTime: "10:00", endTime: "10:40", room: "L1" },
      { classId: classFrench.id, dayOfWeek: 2, startTime: "11:00", endTime: "11:40", room: "F2", week: "A" },
      { classId: classFrench.id, dayOfWeek: 4, startTime: "13:30", endTime: "14:10", room: "F2", week: "B" },
    ],
  });

  await prisma.termlyGoal.createMany({
    data: [
      { title: "Introduce weekly vocab quizzes for 7L1", category: "professional", term: "Michaelmas", academicYear: term.academicYear, progress: 60, status: "in-progress" },
      { title: "Settle new starters into tutor group routines", category: "pastoral", term: "Michaelmas", academicYear: term.academicYear, progress: 80, status: "in-progress" },
      { title: "Complete first aid refresher", category: "personal", term: "Michaelmas", academicYear: term.academicYear, progress: 0, status: "not-started" },
    ],
  });

  const sowTopic1 = await prisma.schemeOfWorkTopic.create({
    data: { classId: classLatin.id, order: 0, title: "Present tense verbs", status: "taught" },
  });
  await prisma.schemeOfWorkTopic.create({
    data: { classId: classLatin.id, order: 1, title: "Noun cases: nominative & accusative", status: "planned" },
  });
  await prisma.schemeOfWorkTopic.create({
    data: { classId: classFrench.id, order: 0, title: "Family vocabulary", status: "taught" },
  });

  await prisma.lessonReflection.create({
    data: {
      classId: classLatin.id,
      topicId: sowTopic1.id,
      whatWorked: "Group translation race — high energy, good recall next lesson.",
      whatDidnt: "Ran slightly over on the starter, cut plenary short.",
      nextSteps: "Trim starter to 5 minutes, use a visible timer.",
      tags: "starter, pacing",
    },
  });

  const assessment = await prisma.markAssessment.create({
    data: { classId: classLatin.id, title: "Vocab test 1", type: "vocab", maxScore: 20 },
  });
  const scoreValues = [18, 15, 12, 19, 9, 16, 14, 17];
  for (let i = 0; i < pupils.length; i++) {
    await prisma.markScore.create({ data: { assessmentId: assessment.id, pupilId: pupils[i].id, score: scoreValues[i] } });
  }

  await prisma.coverFolder.create({
    data: {
      classId: classLatin.id,
      standingCoverLesson: "Worksheet pack in top drawer of teacher desk — silent vocab revision, no talking.",
      seatingNotes: "Boy/girl seating plan on wall by door.",
      pupilNotes: "Oscar W needs to sit at the front.",
    },
  });

  await prisma.dutyRotaEntry.createMany({
    data: [
      { dayOfWeek: 1, startTime: "12:30", endTime: "13:00", type: "lunch", location: "Dining hall" },
      { dayOfWeek: 4, startTime: "10:40", endTime: "10:55", type: "break", location: "Quad" },
    ],
  });

  await prisma.pastoralNote.create({
    data: { pupilId: pupils[0].id, note: "Settling in well this term, made a good group of friends." },
  });
  await prisma.parentCommunicationLog.create({
    data: { pupilId: pupils[1].id, method: "email", summary: "Discussed prep routine and organisation strategies." },
  });

  const team = await prisma.team.create({ data: { name: "U11B Cricket", sport: "Cricket", season: "Summer" } });
  for (const pupil of pupils.slice(0, 6)) {
    await prisma.teamPupil.create({ data: { teamId: team.id, pupilId: pupil.id } });
  }
  await prisma.trainingSession.create({ data: { teamId: team.id, dayOfWeek: 3, startTime: "15:30", endTime: "16:30", location: "Nets" } });
  await prisma.fixture.create({
    data: {
      teamId: team.id,
      date: new Date(Date.UTC(year, 8, 20)),
      opponent: "Demo School B",
      homeAway: "home",
      result: "W",
      scoreSummary: "142-6 vs 118 all out",
    },
  });
  await prisma.kitChecklistItem.createMany({
    data: [
      { teamId: team.id, item: "Match balls", season: "Summer", checked: true },
      { teamId: team.id, item: "Scorebook", season: "Summer", checked: false },
    ],
  });

  await prisma.cPDEntry.create({
    data: { title: "Safeguarding refresher", provider: "NSPCC Learning", hours: 3, reflection: "Useful update on reporting routes and thresholds." },
  });
  await prisma.qualification.createMany({
    data: [
      { name: "First Aid at Work", issuedDate: new Date(Date.UTC(year - 2, 0, 10)), expiryDate: new Date(Date.UTC(year, 11, 1)), reminderDays: 30 },
      { name: "Safeguarding Level 1", issuedDate: new Date(Date.UTC(year - 1, 5, 1)), expiryDate: new Date(Date.UTC(year + 1, 5, 1)), reminderDays: 30 },
    ],
  });
  await prisma.careerMilestone.create({ data: { title: "Led Latin department curriculum review", description: "Coordinated a full review of KS3 scheme of work." } });

  await prisma.contact.createMany({
    data: [
      { name: "School Office", type: "school", phone: "01234 567890", credentialsLocation: "in password manager" },
      { name: "Medical Centre", type: "school", phone: "01234 567891" },
      { name: "County Cricket Coach", type: "external", email: "coach@example.com" },
    ],
  });

  await prisma.procedureDoc.create({
    data: { title: "Fire assembly point", category: "fire", content: "Assemble on the main field, register pupils by tutor group, report to Deputy Head." },
  });

  await prisma.calendarEvent.createMany({
    data: [
      { title: "INSET day", date: new Date(Date.UTC(year, 8, 4)), category: "admin", type: "inset" },
      { title: "Parents' evening — Year 7", date: new Date(Date.UTC(year, 9, 15)), category: "academic", type: "parents-evening" },
    ],
  });

  await prisma.task.createMany({
    data: [
      { title: "Chase 7L1 prep books", category: "academic" },
      { title: "Order new cricket kit", category: "sport" },
    ],
  });
  await prisma.note.create({ data: { title: "Idea", content: "Try a Latin vocab quiz app next term." } });

  res.json({ ok: true, pupilsCreated: pupils.length });
});

export default router;
