import { Router } from "express";
import { prisma } from "../lib/prisma";
import { addDays, endOfDay, endOfWeek, isoWeekday, startOfDay, startOfWeek } from "../lib/dates";
import { getCurrentTimetableWeek } from "../lib/timetableWeek";

const router = Router();

router.get("/", async (req, res) => {
  const now = new Date();
  const today0 = startOfDay(now);
  const today1 = endOfDay(now);
  const dow = isoWeekday(now); // 1-6 school days (Saturday runs on Week A only)
  const week = await getCurrentTimetableWeek(now);
  const appConfig = await prisma.appConfig.findUnique({ where: { id: 1 } });
  const timetableSeason = appConfig?.activeTimetableSeason ?? "winter";

  const [timetableToday, dutiesToday, trainingToday, fixturesToday, tasks, upcomingEvents, weekEvents] =
    await Promise.all([
      dow <= 6
        ? prisma.timetableSlot.findMany({
            where: { dayOfWeek: dow, season: timetableSeason, OR: [{ week: null }, { week }] },
            include: { class: true },
            orderBy: { startTime: "asc" },
          })
        : Promise.resolve([]),
      prisma.dutyRotaEntry.findMany({
        where: {
          OR: [
            { specificDate: { gte: today0, lte: today1 } },
            { specificDate: null, dayOfWeek: dow },
          ],
        },
        orderBy: { startTime: "asc" },
      }),
      dow <= 5
        ? prisma.trainingSession.findMany({
            where: { dayOfWeek: dow },
            include: { team: true },
            orderBy: { startTime: "asc" },
          })
        : Promise.resolve([]),
      prisma.fixture.findMany({
        where: { deletedAt: null, date: { gte: today0, lte: today1 } },
        include: { team: true },
      }),
      prisma.task.findMany({
        where: { deletedAt: null, done: false },
        orderBy: { dueDate: "asc" },
        take: 8,
      }),
      prisma.calendarEvent.findMany({
        where: { deletedAt: null, date: { gte: today0 } },
        orderBy: { date: "asc" },
        take: 8,
      }),
      prisma.calendarEvent.findMany({
        where: { deletedAt: null, date: { gte: startOfWeek(now), lte: endOfWeek(now) } },
        orderBy: { date: "asc" },
      }),
    ]);

  // Countdown to next half term / end of term
  const currentTerm = await prisma.term.findFirst({
    where: { deletedAt: null, startDate: { lte: now }, endDate: { gte: now } },
    orderBy: { startDate: "desc" },
  });
  const nextTerm = currentTerm
    ? null
    : await prisma.term.findFirst({
        where: { deletedAt: null, startDate: { gt: now } },
        orderBy: { startDate: "asc" },
      });

  let countdown: {
    term: string | null;
    nextHalfTerm: Date | null;
    nextHalfTermTimeLabel: string | null;
    endOfTerm: Date | null;
    endOfTermTimeLabel: string | null;
    nextTermStart: Date | null;
    nextTermStartTimeLabel: string | null;
  } = {
    term: null,
    nextHalfTerm: null,
    nextHalfTermTimeLabel: null,
    endOfTerm: null,
    endOfTermTimeLabel: null,
    nextTermStart: null,
    nextTermStartTimeLabel: null,
  };

  if (currentTerm) {
    const halfTermCandidates = [
      { date: currentTerm.halfTermStart, label: currentTerm.halfTermStartTimeLabel },
      { date: currentTerm.halfTermEnd, label: currentTerm.halfTermEndTimeLabel },
    ]
      .filter((c): c is { date: Date; label: string | null } => !!c.date && c.date > now)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    countdown = {
      term: `${currentTerm.name} ${currentTerm.academicYear}`,
      nextHalfTerm: halfTermCandidates[0]?.date ?? null,
      nextHalfTermTimeLabel: halfTermCandidates[0]?.label ?? null,
      endOfTerm: currentTerm.endDate,
      endOfTermTimeLabel: currentTerm.endTimeLabel,
      nextTermStart: null,
      nextTermStartTimeLabel: null,
    };
  } else if (nextTerm) {
    countdown = {
      term: null,
      nextHalfTerm: null,
      nextHalfTermTimeLabel: null,
      endOfTerm: null,
      endOfTermTimeLabel: null,
      nextTermStart: nextTerm.startDate,
      nextTermStartTimeLabel: nextTerm.startTimeLabel,
    };
  }

  res.json({
    date: now,
    week,
    timetableSeason,
    timetableToday,
    dutiesToday,
    trainingToday,
    fixturesToday,
    tasks,
    upcomingEvents,
    weekEvents,
    countdown,
  });
});

export default router;
