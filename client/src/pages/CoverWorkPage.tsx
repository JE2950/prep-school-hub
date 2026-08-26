import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatDateLong, toInputDate } from "../lib/dates";

export function CoverWorkPage() {
  const [date, setDate] = useState(toInputDate(new Date()));
  const [data, setData] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);

  async function load() {
    setData(await api.get(`/cover-sheet?date=${date}`));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  useEffect(() => {
    api.get<any[]>("/classes").then(setClasses);
  }, []);

  return (
    <div>
      <div className="no-print flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Cover work</h1>
          <p className="text-sm text-ink-500 mt-0.5">Generate a printable cover sheet, or edit a class's standing cover folder.</p>
        </div>
        <div className="flex items-center gap-2">
          <input className="input !w-auto" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <button className="btn-primary" onClick={() => window.print()}>
            🖨 Print cover sheet
          </button>
        </div>
      </div>

      <div className="card p-6" id="cover-sheet">
        <h2 className="text-lg font-semibold text-ink-900 mb-1">Cover sheet — {formatDateLong(date)}</h2>
        <p className="text-sm text-ink-500 mb-4">
          Timetable Week {data?.week ?? "—"} · {data?.season === "summer" ? "Summer" : "Winter"} timetable
        </p>

        {data && data.lessons.length === 0 && <p className="text-sm text-ink-400">No lessons scheduled this day.</p>}

        <div className="space-y-4">
          {data?.lessons.map((l: any, i: number) => (
            <div key={i} className="border border-ink-200 rounded-lg p-4 break-inside-avoid">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-ink-900">
                  {l.className} · {l.subject}
                </h3>
                <span className="text-sm text-ink-500">
                  {l.startTime}–{l.endTime}
                  {l.room ? ` · ${l.room}` : ""}
                </span>
              </div>
              {l.currentTopic && <p className="text-sm text-ink-700 mb-1"><strong>Current topic:</strong> {l.currentTopic}</p>}
              <p className="text-sm text-ink-700 mb-1"><strong>Roster:</strong> {l.rosterCount} pupils</p>
              {l.standingCoverLesson && (
                <p className="text-sm text-ink-700 mb-1"><strong>Cover lesson:</strong> {l.standingCoverLesson}</p>
              )}
              {l.seatingNotes && <p className="text-sm text-ink-700 mb-1"><strong>Seating:</strong> {l.seatingNotes}</p>}
              {l.pupilNotes && <p className="text-sm text-ink-700"><strong>Pupil notes:</strong> {l.pupilNotes}</p>}
              {!l.standingCoverLesson && !l.seatingNotes && !l.pupilNotes && (
                <p className="text-sm text-amber-700 no-print">No cover folder set up for this class yet.</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="no-print card p-4 mt-4">
        <h2 className="text-sm font-semibold text-ink-900 mb-3">Edit cover folders by class</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {classes.map((c) => (
            <Link key={c.id} to={`/classes/${c.id}`} className="rounded-lg border border-ink-100 p-3 hover:border-brand-300 text-sm">
              <p className="font-medium text-ink-800">{c.name}</p>
              <p className="text-xs text-ink-500">{c.coverFolder ? "Cover folder set up" : "Not set up yet"}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
