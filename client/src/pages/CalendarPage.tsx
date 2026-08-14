import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { formatDate } from "../lib/dates";
import { Modal } from "../components/Modal";
import { FieldDef, ResourceForm } from "../components/ResourceForm";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate: string | null;
  category: string;
  type: string | null;
  notes: string | null;
}

interface Term {
  id: string;
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  halfTermStart: string | null;
  halfTermEnd: string | null;
}

const CATEGORY_COLOUR: Record<string, string> = {
  academic: "bg-category-academic",
  sport: "bg-category-sport",
  pastoral: "bg-category-pastoral",
  admin: "bg-category-admin",
  personal: "bg-category-personal",
};

const eventFields: FieldDef[] = [
  { key: "title", label: "Title", type: "text", required: true, span: 2 },
  { key: "date", label: "Date", type: "date", required: true },
  { key: "endDate", label: "End date (optional)", type: "date" },
  {
    key: "category",
    label: "Category",
    type: "select",
    required: true,
    options: [
      { value: "academic", label: "Academic" },
      { value: "sport", label: "Sport" },
      { value: "pastoral", label: "Pastoral" },
      { value: "admin", label: "Admin" },
      { value: "personal", label: "Personal" },
    ],
  },
  {
    key: "type",
    label: "Type",
    type: "select",
    options: [
      { value: "exeat", label: "Exeat" },
      { value: "inset", label: "INSET day" },
      { value: "exam", label: "Exam" },
      { value: "ce", label: "Common Entrance" },
      { value: "scholarship", label: "Scholarship" },
      { value: "report-deadline", label: "Report deadline" },
      { value: "parents-evening", label: "Parents' evening" },
      { value: "other", label: "Other" },
    ],
  },
  { key: "notes", label: "Notes", type: "textarea", span: 2 },
];

const termFields: FieldDef[] = [
  {
    key: "name",
    label: "Term",
    type: "select",
    required: true,
    options: [
      { value: "Michaelmas", label: "Michaelmas" },
      { value: "Lent", label: "Lent" },
      { value: "Summer", label: "Summer" },
    ],
  },
  { key: "academicYear", label: "Academic year (e.g. 2025/26)", type: "text", required: true },
  { key: "startDate", label: "Start date", type: "date", required: true },
  { key: "endDate", label: "End date", type: "date", required: true },
  { key: "halfTermStart", label: "Half term start", type: "date" },
  { key: "halfTermEnd", label: "Half term end", type: "date" },
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function CalendarPage() {
  const [tab, setTab] = useState<"calendar" | "terms">("calendar");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [modal, setModal] = useState<{ mode: "event" | "term"; editing: any | null; presetDate?: string } | null>(
    null
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  async function load() {
    setEvents(await api.get<CalendarEvent[]>("/calendar-events"));
    setTerms(await api.get<Term[]>("/terms"));
  }

  useEffect(() => {
    load();
  }, []);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const totalDays = daysInMonth(year, month);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      if (categoryFilter && e.category !== categoryFilter) continue;
      const key = new Date(e.date).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [events, categoryFilter]);

  async function handleEventSubmit(values: Record<string, unknown>) {
    if (modal?.editing) {
      await api.put(`/calendar-events/${modal.editing.id}`, values);
    } else {
      await api.post("/calendar-events", values);
    }
    setModal(null);
    load();
  }

  async function handleTermSubmit(values: Record<string, unknown>) {
    if (modal?.editing) {
      await api.put(`/terms/${modal.editing.id}`, values);
    } else {
      await api.post("/terms", values);
    }
    setModal(null);
    load();
  }

  async function deleteEvent(id: string) {
    if (!confirm("Delete this calendar entry?")) return;
    await api.del(`/calendar-events/${id}`);
    load();
  }

  async function deleteTerm(id: string) {
    if (!confirm("Delete this term?")) return;
    await api.del(`/terms/${id}`);
    load();
  }

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-ink-900">Academic year calendar</h1>
        <div className="flex gap-2">
          <button className={tab === "calendar" ? "btn-primary" : "btn-secondary"} onClick={() => setTab("calendar")}>
            Calendar
          </button>
          <button className={tab === "terms" ? "btn-primary" : "btn-secondary"} onClick={() => setTab("terms")}>
            Term dates
          </button>
        </div>
      </div>

      {tab === "calendar" ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <button className="btn-secondary" onClick={() => setCursor(new Date(year, month - 1, 1))}>
                ‹
              </button>
              <span className="text-sm font-medium text-ink-800 w-36 text-center">
                {cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
              </span>
              <button className="btn-secondary" onClick={() => setCursor(new Date(year, month + 1, 1))}>
                ›
              </button>
            </div>
            <div className="flex items-center gap-2">
              <select className="input !w-auto" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="">All categories</option>
                {Object.keys(CATEGORY_COLOUR).map((c) => (
                  <option key={c} value={c}>
                    {c[0].toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
              <button className="btn-primary" onClick={() => setModal({ mode: "event", editing: null })}>
                + Add entry
              </button>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="grid grid-cols-7 border-b border-ink-100 text-xs font-medium text-ink-500">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="px-2 py-2 text-center">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                const dateObj = day ? new Date(year, month, day) : null;
                const dayEvents = dateObj ? eventsByDay.get(dateObj.toDateString()) ?? [] : [];
                const isToday = dateObj && dateObj.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={i}
                    className={`min-h-[86px] border-b border-r border-ink-50 p-1.5 ${day ? "cursor-pointer hover:bg-ink-50/60" : "bg-ink-50/30"}`}
                    onClick={() =>
                      day &&
                      setModal({
                        mode: "event",
                        editing: null,
                        presetDate: new Date(year, month, day).toISOString().slice(0, 10),
                      })
                    }
                  >
                    {day && (
                      <>
                        <p className={`text-xs mb-1 ${isToday ? "font-bold text-brand-700" : "text-ink-400"}`}>{day}</p>
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 3).map((e) => (
                            <div
                              key={e.id}
                              className="flex items-center gap-1 truncate"
                              title={e.title}
                              onClick={(ev) => {
                                ev.stopPropagation();
                                setModal({ mode: "event", editing: e });
                              }}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${CATEGORY_COLOUR[e.category] ?? "bg-ink-300"}`} />
                              <span className="text-[10px] text-ink-700 truncate">{e.title}</span>
                            </div>
                          ))}
                          {dayEvents.length > 3 && <p className="text-[10px] text-ink-400">+{dayEvents.length - 3} more</p>}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-4 mt-4">
            <h2 className="text-sm font-semibold text-ink-900 mb-3">All entries this month</h2>
            <ul className="divide-y divide-ink-50">
              {events
                .filter((e) => new Date(e.date).getFullYear() === year && new Date(e.date).getMonth() === month)
                .filter((e) => !categoryFilter || e.category === categoryFilter)
                .map((e) => (
                  <li key={e.id} className="py-2 flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${CATEGORY_COLOUR[e.category] ?? "bg-ink-300"}`} />
                    <span className="text-sm text-ink-800 flex-1">{e.title}</span>
                    <span className="text-xs text-ink-400">{formatDate(e.date)}</span>
                    <button className="text-xs text-ink-400 hover:text-brand-700" onClick={() => setModal({ mode: "event", editing: e })}>
                      Edit
                    </button>
                    <button className="text-xs text-ink-400 hover:text-red-600" onClick={() => deleteEvent(e.id)}>
                      Delete
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="card p-4">
          <div className="flex justify-end mb-3">
            <button className="btn-primary" onClick={() => setModal({ mode: "term", editing: null })}>
              + Add term
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-500 border-b border-ink-100">
                <th className="py-2 font-medium">Term</th>
                <th className="py-2 font-medium">Year</th>
                <th className="py-2 font-medium">Starts</th>
                <th className="py-2 font-medium">Ends</th>
                <th className="py-2 font-medium">Half term</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {terms.map((t) => (
                <tr key={t.id} className="border-b border-ink-50">
                  <td className="py-2">{t.name}</td>
                  <td className="py-2">{t.academicYear}</td>
                  <td className="py-2">{formatDate(t.startDate)}</td>
                  <td className="py-2">{formatDate(t.endDate)}</td>
                  <td className="py-2">
                    {t.halfTermStart ? `${formatDate(t.halfTermStart)} – ${formatDate(t.halfTermEnd)}` : "—"}
                  </td>
                  <td className="py-2 text-right">
                    <button className="text-xs text-ink-400 hover:text-brand-700 mr-3" onClick={() => setModal({ mode: "term", editing: t })}>
                      Edit
                    </button>
                    <button className="text-xs text-ink-400 hover:text-red-600" onClick={() => deleteTerm(t.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && modal.mode === "event" && (
        <Modal title={modal.editing ? "Edit calendar entry" : "Add calendar entry"} onClose={() => setModal(null)}>
          <ResourceForm
            fields={eventFields}
            initial={modal.editing ?? (modal.presetDate ? { date: modal.presetDate } : undefined)}
            onCancel={() => setModal(null)}
            onSubmit={handleEventSubmit}
          />
        </Modal>
      )}

      {modal && modal.mode === "term" && (
        <Modal title={modal.editing ? "Edit term" : "Add term"} onClose={() => setModal(null)}>
          <ResourceForm fields={termFields} initial={modal.editing ?? undefined} onCancel={() => setModal(null)} onSubmit={handleTermSubmit} />
        </Modal>
      )}
    </div>
  );
}
