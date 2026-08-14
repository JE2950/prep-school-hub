import { prisma } from "./prisma";
import { startOfWeek } from "./dates";

// Determines whether "today" falls on Week A or Week B of a two-week timetable
// cycle, counted from the start of the current term. Weeks are Mon-based.
export async function getCurrentTimetableWeek(date: Date): Promise<"A" | "B"> {
  const term = await prisma.term.findFirst({
    where: { startDate: { lte: date }, endDate: { gte: date } },
    orderBy: { startDate: "desc" },
  });
  if (!term) return "A";

  const termWeekStart = startOfWeek(term.startDate);
  const thisWeekStart = startOfWeek(date);
  const diffWeeks = Math.round(
    (thisWeekStart.getTime() - termWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  return diffWeeks % 2 === 0 ? "A" : "B";
}
