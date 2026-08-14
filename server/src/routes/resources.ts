import { Router } from "express";
import { crudRouter } from "../lib/crudFactory";

const router = Router();

router.use(
  "/terms",
  crudRouter("term", { orderBy: { startDate: "asc" } })
);

router.use(
  "/calendar-events",
  crudRouter("calendarEvent", { orderBy: { date: "asc" } })
);

router.use(
  "/tutor-groups",
  crudRouter("tutorGroup", {
    include: { pupils: true },
    orderBy: { name: "asc" },
  })
);

router.use(
  "/pupils",
  crudRouter("pupil", {
    include: { tutorGroup: true, classes: { include: { class: true } } },
    orderBy: { lastName: "asc" },
    filterKeys: ["tutorGroupId"],
  })
);

router.use(
  "/classes",
  crudRouter("class", {
    include: {
      pupils: { include: { pupil: true } },
      sowTopics: { orderBy: { order: "asc" } },
      coverFolder: true,
    },
    orderBy: { name: "asc" },
  })
);

router.use(
  "/class-pupils",
  crudRouter("classPupil", { filterKeys: ["classId", "pupilId"] })
);

router.use(
  "/timetable-slots",
  crudRouter("timetableSlot", {
    include: { class: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    filterKeys: ["classId"],
  })
);

router.use(
  "/termly-goals",
  crudRouter("termlyGoal", { orderBy: { createdAt: "desc" } })
);

router.use(
  "/sow-topics",
  crudRouter("schemeOfWorkTopic", {
    orderBy: { order: "asc" },
    filterKeys: ["classId"],
  })
);

router.use(
  "/lesson-reflections",
  crudRouter("lessonReflection", {
    include: { class: true, topic: true },
    orderBy: { date: "desc" },
    filterKeys: ["classId"],
  })
);

router.use(
  "/mark-assessments",
  crudRouter("markAssessment", {
    include: { scores: true },
    orderBy: { date: "desc" },
    filterKeys: ["classId"],
  })
);

router.use(
  "/mark-scores",
  crudRouter("markScore", { filterKeys: ["assessmentId", "pupilId"] })
);

router.use(
  "/ce-candidates",
  crudRouter("cECandidate", {
    include: { pupil: true, results: true },
    filterKeys: ["pupilId"],
  })
);

router.use(
  "/ce-results",
  crudRouter("cEPracticeResult", {
    orderBy: { date: "desc" },
    filterKeys: ["candidateId"],
  })
);

router.use(
  "/cover-folders",
  crudRouter("coverFolder", { filterKeys: ["classId"] })
);

router.use(
  "/duty-rota",
  crudRouter("dutyRotaEntry", {
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  })
);

router.use(
  "/pastoral-notes",
  crudRouter("pastoralNote", {
    include: { pupil: true },
    orderBy: { date: "desc" },
    filterKeys: ["pupilId"],
  })
);

router.use(
  "/comms-log",
  crudRouter("parentCommunicationLog", {
    include: { pupil: true },
    orderBy: { date: "desc" },
    filterKeys: ["pupilId"],
  })
);

router.use(
  "/teams",
  crudRouter("team", {
    include: {
      pupils: { include: { pupil: true } },
      training: true,
      fixtures: { orderBy: { date: "asc" } },
      kitItems: true,
    },
    orderBy: { name: "asc" },
  })
);

router.use(
  "/team-pupils",
  crudRouter("teamPupil", { filterKeys: ["teamId", "pupilId"] })
);

router.use(
  "/training-sessions",
  crudRouter("trainingSession", { filterKeys: ["teamId"] })
);

router.use(
  "/fixtures",
  crudRouter("fixture", {
    include: { team: true },
    orderBy: { date: "asc" },
    filterKeys: ["teamId"],
  })
);

router.use(
  "/kit-items",
  crudRouter("kitChecklistItem", { filterKeys: ["teamId"] })
);

router.use(
  "/cpd-entries",
  crudRouter("cPDEntry", { orderBy: { date: "desc" } })
);

router.use(
  "/qualifications",
  crudRouter("qualification", { orderBy: { expiryDate: "asc" } })
);

router.use(
  "/career-milestones",
  crudRouter("careerMilestone", { orderBy: { date: "desc" } })
);

router.use(
  "/contacts",
  crudRouter("contact", { orderBy: { name: "asc" } })
);

router.use(
  "/procedures",
  crudRouter("procedureDoc", { orderBy: { order: "asc" } })
);

router.use(
  "/tasks",
  crudRouter("task", { orderBy: [{ done: "asc" }, { dueDate: "asc" }] })
);

router.use(
  "/notes",
  crudRouter("note", { orderBy: { date: "desc" } })
);

export default router;
