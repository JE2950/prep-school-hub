export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

// ISO weekday: Monday = 1 .. Sunday = 7
export function isoWeekday(d: Date): number {
  const day = d.getDay();
  return day === 0 ? 7 : day;
}

export function startOfWeek(d: Date): Date {
  return startOfDay(addDays(d, -(isoWeekday(d) - 1)));
}

export function endOfWeek(d: Date): Date {
  return endOfDay(addDays(startOfWeek(d), 4)); // Mon-Fri school week
}
