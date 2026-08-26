import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Modal } from "../../components/Modal";
import { FieldDef, ResourceForm } from "../../components/ResourceForm";
import { ImportExportBar } from "../../components/ImportExportBar";

interface Slot {
  id: string;
  dayOfWeek: number;
  week: string | null;
  season: string;
  startTime: string;
  endTime: string;
  room: string | null;
  classId: string;
  class: { name: string; subject: string };
}

interface ClassItem {
  id: string;
  name: string;
  subject: string;
}

type Season = "winter" | "summer";

const DAYS = [
  { n: 1, label: "Monday" },
  { n: 2, label: "Tuesday" },
  { n: 3, label: "Wednesday" },
  { n: 4, label: "Thursday" },
  { n: 5, label: "Friday" },
  { n: 6, label: "Saturday" },
];

export function TimetableBuilderPage() {
  const [season, setSeason] = useState<Season>("winter");
  const [seasonLoading, setSeasonLoading] = useState(true);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [modal, setModal] = useState<{ editing: Slot | null; presetDay?: number } | null>(null);

  async function loadSeason() {
    const { season: current } = await api.get<{ season: Season }>("/settings/timetable-season");
    setSeason(current);
    setSeasonLoading(false);
  }

  async function load(forSeason: Season) {
    const [s, c] = await Promise.all([
      api.get<Slot[]>(`/timetable-slots?season=${forSeason}`),
      api.get<ClassItem[]>("/classes"),
    ]);
    setSlots(s);
    setClasses(c);
  }

  useEffect(() => {
    loadSeason();
  }, []);

  useEffect(() => {
    if (!seasonLoading) load(season);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season, seasonLoading]);

  async function switchSeason(next: Season) {
    if (next === season) return;
    setSeason(next);
    await api.put("/settings/timetable-season", { season: next });
  }

  const fields: FieldDef[] = [
    {
      key: "classId",
      label: "Class",
      type: "select",
      required: true,
      options: classes.map((c) => ({ value: c.id, label: `${c.name} (${c.subject})` })),
    },
    {
      key: "dayOfWeek",
      label: "Day",
      type: "select",
      required: true,
      options: DAYS.map((d) => ({ value: String(d.n), label: d.label })),
    },
    {
      key: "week",
      label: "Week (leave blank for every week — Saturday lessons are usually Week A only)",
      type: "select",
      options: [
        { value: "A", label: "Week A" },
        { value: "B", label: "Week B" },
      ],
    },
    { key: "startTime", label: "Start time", type: "time", required: true },
    { key: "endTime", label: "End time", type: "time", required: true },
    { key: "room", label: "Room", type: "text" },
  ];

  async function handleSubmit(values: Record<string, unknown>) {
    const payload = { ...values, dayOfWeek: Number(values.dayOfWeek), week: values.week || null, season };
    if (modal?.editing) {
      await api.put(`/timetable-slots/${modal.editing.id}`, payload);
    } else {
      await api.post("/timetable-slots", payload);
    }
    setModal(null);
    load(season);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this timetable slot?")) return;
    await api.del(`/timetable-slots/${id}`);
    load(season);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Timetable builder</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            Supports a two-week (A/B) cycle — leave "week" blank for lessons that happen every week. Saturday
            lessons typically only run in Week A.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModal({ editing: null })}>
          + Add slot
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-ink-200 p-0.5 bg-ink-50">
          <button
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              season === "winter" ? "bg-white shadow-sm text-brand-800" : "text-ink-500 hover:text-ink-800"
            }`}
            onClick={() => switchSeason("winter")}
          >
            ❄️ Winter timetable
          </button>
          <button
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              season === "summer" ? "bg-white shadow-sm text-brand-800" : "text-ink-500 hover:text-ink-800"
            }`}
            onClick={() => switchSeason("summer")}
          >
            ☀️ Summer timetable
          </button>
        </div>
        <p className="text-xs text-ink-400">
          This is the timetable currently in effect across the app — switch it when the timetable changes for the
          summer term.
        </p>
      </div>

      <div className="mb-4">
        <ImportExportBar
          label="Timetable"
          templateUrl="/api/imports/timetable/template"
          exportUrl="/api/imports/timetable/export"
          importUrl="/imports/timetable"
          onImported={() => load(season)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {DAYS.map((day) => {
          const daySlots = slots
            .filter((s) => s.dayOfWeek === day.n)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
          return (
            <div key={day.n} className="card p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-ink-800">{day.label}</h3>
                <button className="text-xs text-brand-700 hover:underline" onClick={() => setModal({ editing: null, presetDay: day.n })}>
                  + add
                </button>
              </div>
              <div className="space-y-1.5">
                {daySlots.length === 0 && <p className="text-xs text-ink-400">No lessons</p>}
                {daySlots.map((s) => (
                  <div key={s.id} className="rounded-lg border border-ink-100 p-2 text-xs group relative">
                    <p className="font-medium text-ink-800">
                      {s.class.name} {s.week && <span className="text-brand-600">· Wk {s.week}</span>}
                    </p>
                    <p className="text-ink-500">
                      {s.startTime}–{s.endTime}
                      {s.room ? ` · ${s.room}` : ""}
                    </p>
                    <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-ink-400 hover:text-brand-700" onClick={() => setModal({ editing: s })}>
                        Edit
                      </button>
                      <button className="text-ink-400 hover:text-red-600" onClick={() => handleDelete(s.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <Modal
          title={`${modal.editing ? "Edit" : "Add"} timetable slot (${season === "summer" ? "Summer" : "Winter"} timetable)`}
          onClose={() => setModal(null)}
        >
          <ResourceForm
            fields={fields}
            initial={
              modal.editing
                ? { ...modal.editing, dayOfWeek: String(modal.editing.dayOfWeek) }
                : modal.presetDay
                ? { dayOfWeek: String(modal.presetDay) }
                : undefined
            }
            onCancel={() => setModal(null)}
            onSubmit={handleSubmit}
          />
        </Modal>
      )}
    </div>
  );
}
