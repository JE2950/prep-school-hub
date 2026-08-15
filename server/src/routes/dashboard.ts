import { Router } from "express";
import { prisma } from "../lib/prisma";
import { addDays, endOfDay, endOfWeek, isoWeekday, startOfDay, startOfWeek } from "../lib/dates";
import { getCurrentTimetableWeek } from "../lib/timetableWeek";

const router = Router();

router.get("/", async (req, res) => {
  const now = new Date();
  const today0 = startOfDay(now);
  const today1 = endOfDay(now);
  const dow = isoWeekday(now); // 1-5 school days
  const week = await getCurrentTimetableWeek(now);

  const [timetableToday, dutiesToday, trainingToday, fixturesToday, tasks, upcomingEvents, weekEvents] =
    await Promise.all([
      dow <= 5
        ? prisma.timetableSlot.findMany({
            where: { dayOfWeek: dow, OR: [{ week: null }, { week }] },
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
    endOfTerm: Date | null;
    nextTermStart: Date | null;
  } = { term: null, nextHalfTerm: null, endOfTerm: null, nextTermStart: null };

  if (currentTerm) {
    const halfTermCandidates = [currentTerm.halfTermStart, currentTerm.halfTermEnd]
      .filter((d): d is Date => !!d && d > now)
      .sort((a, b) => a.getTime() - b.getTime());
    countdown = {
      term: `${currentTerm.name} ${currentTerm.academicYear}`,
      nextHalfTerm: halfTermCandidates[0] ?? null,
      endOfTerm: currentTerm.endDate,
      nextTermStart: null,
    };
  } else if (nextTerm) {
    countdown = {
      term: null,
      nextHalfTerm: null,
      endOfTerm: null,
      nextTermStart: nextTerm.startDate,
    };
  }

  res.json({
    date: now,
    week,
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
