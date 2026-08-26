import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { daysUntil, DAY_NAMES, formatDate, formatDateLong, formatDateShort } from "../lib/dates";
import { QuickLinksPanel } from "../components/QuickLinksPanel";

interface DashboardData {
  date: string;
  week: "A" | "B";
  timetableSeason: "winter" | "summer";
  timetableToday: any[];
  dutiesToday: any[];
  trainingToday: any[];
  fixturesToday: any[];
  tasks: any[];
  upcomingEvents: any[];
  weekEvents: any[];
  countdown: {
    term: string | null;
    nextHalfTerm: string | null;
    nextHalfTermTimeLabel: string | null;
    endOfTerm: string | null;
    endOfTermTimeLabel: string | null;
    nextTermStart: string | null;
    nextTermStartTimeLabel: string | null;
  };
}

const CATEGORY_COLOUR: Record<string, string> = {
  academic: "bg-category-academic",
  sport: "bg-category-sport",
  pastoral: "bg-category-pastoral",
  admin: "bg-category-admin",
  personal: "bg-category-personal",
};

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  async function load() {
    setData(await api.get<DashboardData>("/dashboard"));
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleTask(id: string, done: boolean) {
    await api.put(`/tasks/${id}`, { done: !done });
    load();
  }

  if (!data) return <p className="text-sm text-ink-400">Loading…</p>;

  const halfTermDays = daysUntil(data.countdown.nextHalfTerm);
  const endTermDays = daysUntil(data.countdown.endOfTerm);
  const nextTermDays = daysUntil(data.countdown.nextTermStart);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold text-ink-900">{formatDateLong(data.date)}</h1>
        <div className="flex items-center gap-2">
          <span className="badge bg-brand-100 text-brand-800">Timetable Week {data.week}</span>
          <Link to="/classes/timetable" className="badge bg-ink-100 text-ink-600 hover:bg-ink-200">
            {data.timetableSeason === "summer" ? "☀️ Summer timetable" : "❄️ Winter timetable"}
          </Link>
        </div>
      </div>

      <QuickLinksPanel />

      {/* Countdown strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs text-ink-500">Current term</p>
          <p className="text-lg font-semibold text-ink-900 mt-0.5">{data.countdown.term ?? "Holidays"}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-500">Next half term</p>
          <p className="text-2xl font-serif font-semibold text-accent-600 mt-0.5">
            {halfTermDays !== null ? `${halfTermDays} day${halfTermDays === 1 ? "" : "s"}` : "—"}
          </p>
          {data.countdown.nextHalfTerm && (
            <p className="text-xs text-ink-400">
              {formatDate(data.countdown.nextHalfTerm)}
              {data.countdown.nextHalfTermTimeLabel ? ` · ${data.countdown.nextHalfTermTimeLabel}` : ""}
            </p>
          )}
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-500">
            {data.countdown.endOfTerm ? "End of term" : "Next term starts"}
          </p>
          <p className="text-2xl font-serif font-semibold text-accent-600 mt-0.5">
            {data.countdown.endOfTerm
              ? endTermDays !== null
                ? `${endTermDays} day${endTermDays === 1 ? "" : "s"}`
                : "—"
              : nextTermDays !== null
              ? `${nextTermDays} day${nextTermDays === 1 ? "" : "s"}`
              : "—"}
          </p>
          <p className="text-xs text-ink-400">
            {formatDate(data.countdown.endOfTerm ?? data.countdown.nextTermStart)}
            {(() => {
              const label = data.countdown.endOfTerm ? data.countdown.endOfTermTimeLabel : data.countdown.nextTermStartTimeLabel;
              return label ? ` · ${label}` : "";
            })()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's timetable */}
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-ink-900 mb-3">Today's timetable</h2>
          {data.timetableToday.length === 0 ? (
            <p className="text-sm text-ink-400">No lessons scheduled today.</p>
          ) : (
            <ul className="space-y-2">
              {data.timetableToday.map((slot) => (
                <li key={slot.id}>
                  <Link
                    to={`/classes/${slot.classId}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-ink-50"
                  >
                    <span className="text-sm text-ink-800">
                      <span className="font-medium">{slot.class.name}</span>{" "}
                      <span className="text-ink-400">· {slot.class.subject}</span>
                    </span>
                    <span className="text-xs text-ink-500">
                      {slot.startTime}–{slot.endTime}
                      {slot.room ? ` · ${slot.room}` : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Duties & co-curricular */}
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-ink-900 mb-3">Duties & co-curricular today</h2>
          {data.dutiesToday.length === 0 && data.trainingToday.length === 0 && data.fixturesToday.length === 0 ? (
            <p className="text-sm text-ink-400">Nothing on today.</p>
          ) : (
            <ul className="space-y-2">
              {data.dutiesToday.map((d) => (
                <li key={d.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-ink-50/60">
                  <span className="text-sm text-ink-800 capitalize">{d.type} duty{d.location ? ` · ${d.location}` : ""}</span>
                  <span className="text-xs text-ink-500">{d.startTime}–{d.endTime}</span>
                </li>
              ))}
              {data.trainingToday.map((t) => (
                <li key={t.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-ink-50/60">
                  <span className="text-sm text-ink-800">Training · {t.team.name}</span>
                  <span className="text-xs text-ink-500">{t.startTime}–{t.endTime}</span>
                </li>
              ))}
              {data.fixturesToday.map((f) => (
                <li key={f.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-ink-50/60">
                  <span className="text-sm text-ink-800">
                    Fixture · {f.team.name} {f.homeAway === "home" ? "vs" : "@"} {f.opponent}
                  </span>
                  <span className="text-xs text-ink-500">{f.venue ?? ""}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tasks */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ink-900">Open tasks</h2>
            <Link to="/planning" className="text-xs text-brand-700 hover:underline">
              View all
            </Link>
          </div>
          {data.tasks.length === 0 ? (
            <p className="text-sm text-ink-400">Nothing outstanding — nicely done.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.tasks.map((t) => (
                <li key={t.id} className="flex items-center gap-2.5 px-1">
                  <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id, t.done)} />
                  <span className="text-sm text-ink-800 flex-1">{t.title}</span>
                  {t.dueDate && <span className="text-xs text-ink-400">{formatDate(t.dueDate)}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Upcoming deadlines */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ink-900">Upcoming deadlines</h2>
            <Link to="/calendar" className="text-xs text-brand-700 hover:underline">
              Full calendar
            </Link>
          </div>
          {data.upcomingEvents.length === 0 ? (
            <p className="text-sm text-ink-400">Nothing coming up.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.upcomingEvents.map((e) => (
                <li key={e.id} className="flex items-center gap-2.5 px-1">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${CATEGORY_COLOUR[e.category] ?? "bg-ink-300"}`} />
                  <span className="text-sm text-ink-800 flex-1">{e.title}</span>
                  <span className="text-xs text-ink-400">{formatDate(e.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Week at a glance */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-ink-900 mb-3">Week at a glance</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[1, 2, 3, 4, 5, 6].map((dow) => {
            const dayEvents = data.weekEvents.filter((e) => new Date(e.date).getDay() === dow % 7);
            const isToday = new Date(data.date).getDay() === dow % 7;
            return (
              <div key={dow} className={`rounded-lg border p-2 min-h-[90px] ${isToday ? "border-brand-300 bg-brand-50/40" : "border-ink-100"}`}>
                <p className="text-xs font-medium text-ink-600 mb-1">{DAY_NAMES[dow].slice(0, 3)}</p>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((e) => (
                    <p key={e.id} className="text-[11px] leading-tight text-ink-600 truncate">
                      {e.title}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
