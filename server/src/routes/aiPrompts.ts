import { Router } from "express";
import { prisma } from "../lib/prisma";
import { addDays } from "../lib/dates";

const router = Router();

function fmt(d: Date | null | undefined): string {
  if (!d) return "unknown date";
  return new Date(d).toLocaleDateString("en-GB");
}

// Every route here returns { prompt: string } — a ready-to-paste prompt built
// from the teacher's own data. No external AI API is called by this server;
// the client offers "open in Claude" / "open in ChatGPT" links alongside it.

router.post("/cover-lesson", async (req, res) => {
  const { classId } = req.body ?? {};
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: { coverFolder: true, sowTopics: { orderBy: { order: "asc" } } },
  });
  if (!cls) return res.status(404).json({ error: "Class not found." });

  const nextTopic = cls.sowTopics.find((t) => t.status === "planned");

  const prompt = `You are helping a UK prep school teacher write a self-contained cover lesson.

Class: ${cls.name} (${cls.subject})
Current topic: ${cls.currentTopic ?? "not set"}
Standing cover lesson notes: ${cls.coverFolder?.standingCoverLesson ?? "none on file"}
Next scheme of work topic (not yet taught): ${nextTopic?.title ?? "none listed"}

Please draft a cover lesson a non-specialist supervising teacher could run with minimal prep. Include:
1. A short recap/starter (5 minutes)
2. A main activity requiring no subject expertise to supervise (worksheet, reading, quiet task)
3. A simple plenary or exit task
4. Clear instructions for what to do if pupils finish early

Keep the language plain and the timings realistic for a UK prep school lesson (35-45 minutes).`;

  res.json({ prompt });
});

router.post("/reflection-summary", async (req, res) => {
  const { classId, from, to } = req.body ?? {};
  const where: any = {};
  if (classId) where.classId = classId;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }
  const reflections = await prisma.lessonReflection.findMany({
    where,
    include: { class: true },
    orderBy: { date: "asc" },
  });

  const bullets = reflections
    .map(
      (r) =>
        `- [${fmt(r.date)}, ${r.class.name}] Worked: ${r.whatWorked ?? "-"} | Didn't work: ${
          r.whatDidnt ?? "-"
        } | Next steps: ${r.nextSteps ?? "-"}`
    )
    .join("\n");

  const prompt = `You are helping a UK prep school teacher turn raw lesson-reflection notes into a tidy end-of-term summary suitable for a department handover or personal review.

Raw reflections:
${bullets || "(no reflections in range)"}

Please write a concise end-of-term summary in British English covering:
1. Overall themes in what worked well
2. Recurring difficulties and what changed in response
3. Concrete next-steps to carry into next term
Keep it to around 250 words, in a professional but personal tone.`;

  res.json({ prompt });
});

router.post("/match-report", async (req, res) => {
  const { fixtureId } = req.body ?? {};
  const fixture = await prisma.fixture.findUnique({ where: { id: fixtureId }, include: { team: true } });
  if (!fixture) return res.status(404).json({ error: "Fixture not found." });

  const prompt = `You are helping a UK prep school teacher write a short match report for the school newsletter/website.

Team: ${fixture.team.name} (${fixture.team.sport})
Fixture: ${fixture.homeAway === "home" ? "vs" : "away at"} ${fixture.opponent}
Date: ${fmt(fixture.date)}
Venue: ${fixture.venue ?? "not recorded"}
Result: ${fixture.result ?? "not recorded"}
Score: ${fixture.scoreSummary ?? "not recorded"}
Teacher's quick notes: ${fixture.matchReportDraft ?? "none"}

Please draft a warm, positive 100-150 word match report in British English suitable for parents, naming standout moments generically (the teacher will fill in specific pupil names).`;

  res.json({ prompt });
});

router.post("/parent-email", async (req, res) => {
  const { commsLogId } = req.body ?? {};
  const entry = await prisma.parentCommunicationLog.findUnique({
    where: { id: commsLogId },
    include: { pupil: true },
  });
  if (!entry) return res.status(404).json({ error: "Communication log entry not found." });

  const recipient = entry.pupil.parentEmail
    ? `${entry.pupil.parentName ?? "Parent/guardian"} <${entry.pupil.parentEmail}>${
        entry.pupil.parentEmail2 ? `, cc: ${entry.pupil.parentEmail2}` : ""
      }`
    : "no parent email on file yet — add one on the pupil's record";

  const prompt = `You are helping a UK prep school teacher draft a follow-up email to a parent, in British English, professional and warm in tone.

Pupil: ${entry.pupil.firstName} ${entry.pupil.lastName}
Send to: ${recipient}
Previous contact: ${entry.method} on ${fmt(entry.date)}
Summary of that contact: ${entry.summary}

Please draft a follow-up parent email that:
1. References the previous contact briefly
2. Gives a clear, honest update
3. Ends with a specific, easy next step or invitation to discuss further
Sign off as "[Your name]".`;

  res.json({ prompt });
});

router.post("/sow-next-steps", async (req, res) => {
  const { classId } = req.body ?? {};
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: { sowTopics: { orderBy: { order: "asc" } } },
  });
  if (!cls) return res.status(404).json({ error: "Class not found." });

  const taught = cls.sowTopics.filter((t) => t.status === "taught" || t.status === "assessed");
  const remaining = cls.sowTopics.filter((t) => t.status === "planned" || t.status === "revisited");

  const prompt = `You are helping a UK prep school teacher plan their next few lessons.

Class: ${cls.name} (${cls.subject})
Topics already taught/assessed, in order: ${taught.map((t) => t.title).join(", ") || "none yet"}
Topics still to teach: ${remaining.map((t) => t.title).join(", ") || "none listed"}

Based on this, suggest a sensible order and pacing for the next 3-4 lessons, flagging anything in the "already taught" list that might be worth revisiting given typical prep-school pupil retention.`;

  res.json({ prompt });
});

router.post("/weekly-todo", async (req, res) => {
  const now = new Date();
  const weekAhead = addDays(now, 7);
  const [events, tasks] = await Promise.all([
    prisma.calendarEvent.findMany({ where: { date: { gte: now, lte: weekAhead } }, orderBy: { date: "asc" } }),
    prisma.task.findMany({ where: { done: false }, orderBy: { dueDate: "asc" } }),
  ]);

  const prompt = `You are helping a UK prep school teacher plan their week. Turn the following into a prioritised to-do list, grouping by urgency (today/this week/can wait), in British English.

Calendar entries in the next 7 days:
${events.map((e) => `- ${fmt(e.date)}: ${e.title} (${e.category})`).join("\n") || "(none)"}

Open tasks:
${tasks.map((t) => `- ${t.title}${t.dueDate ? ` (due ${fmt(t.dueDate)})` : ""}`).join("\n") || "(none)"}

Please produce a short, practical weekly to-do list.`;

  res.json({ prompt });
});

export default router;
