import { Router } from "express";
import { prisma } from "../lib/prisma";
import { isoWeekday } from "../lib/dates";
import { getCurrentTimetableWeek } from "../lib/timetableWeek";

const router = Router();

// GET /api/cover-sheet?date=YYYY-MM-DD
// Compiles the day's lessons + each class's cover folder into one payload
// the client renders as a printable page.
router.get("/", async (req, res) => {
  const date = req.query.date ? new Date(String(req.query.date)) : new Date();
  const dow = isoWeekday(date);
  const week = await getCurrentTimetableWeek(date);
  const appConfig = await prisma.appConfig.findUnique({ where: { id: 1 } });
  const season = appConfig?.activeTimetableSeason ?? "winter";

  if (dow > 6) {
    return res.json({ date, week, season, lessons: [] });
  }

  const slots = await prisma.timetableSlot.findMany({
    where: { dayOfWeek: dow, season, OR: [{ week: null }, { week }] },
    include: {
      class: {
        include: {
          coverFolder: true,
          pupils: { include: { pupil: true } },
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  const lessons = slots.map((slot) => ({
    startTime: slot.startTime,
    endTime: slot.endTime,
    room: slot.room,
    className: slot.class.name,
    subject: slot.class.subject,
    currentTopic: slot.class.currentTopic,
    rosterCount: slot.class.pupils.length,
    roster: slot.class.pupils.map((cp) => `${cp.pupil.firstName} ${cp.pupil.lastName}`),
    standingCoverLesson: slot.class.coverFolder?.standingCoverLesson ?? null,
    seatingNotes: slot.class.coverFolder?.seatingNotes ?? null,
    pupilNotes: slot.class.coverFolder?.pupilNotes ?? null,
  }));

  res.json({ date, week, season, lessons });
});

export default router;
