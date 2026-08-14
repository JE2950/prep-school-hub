import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatDate } from "../lib/dates";
import { Modal } from "../components/Modal";
import { FieldDef, ResourceForm } from "../components/ResourceForm";
import { AiPromptButton } from "../components/AiPromptPanel";

type Tab = "rota" | "tutorGroup" | "pastoralNotes" | "comms";

const DAY_OPTIONS = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "7", label: "Sunday" },
];
const DAY_NAME: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday",
};

export function PastoralPage() {
  const [tab, setTab] = useState<Tab>("rota");

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink-900 mb-4">Duties, pastoral & tutor group</h1>
      <div className="flex gap-1 border-b border-ink-200 mb-4 overflow-x-auto">
        {(
          [
            ["rota", "Duty rota"],
            ["tutorGroup", "Tutor group"],
            ["pastoralNotes", "Pastoral notes"],
            ["comms", "Parent communication"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${
              tab === key ? "border-brand-600 text-brand-800" : "border-transparent text-ink-500 hover:text-ink-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "rota" && <DutyRotaTab />}
      {tab === "tutorGroup" && <TutorGroupTab />}
      {tab === "pastoralNotes" && <PastoralNotesTab />}
      {tab === "comms" && <CommsLogTab />}
    </div>
  );
}

function DutyRotaTab() {
  const [entries, setEntries] = useState<any[]>([]);
  const [modal, setModal] = useState<{ editing: any | null } | null>(null);

  async function load() {
    setEntries(await api.get("/duty-rota"));
  }
  useEffect(() => {
    load();
  }, []);

  const fields: FieldDef[] = [
    { key: "dayOfWeek", label: "Day", type: "select", required: true, options: DAY_OPTIONS },
    { key: "startTime", label: "Start time", type: "time", required: true },
    { key: "endTime", label: "End time", type: "time", required: true },
    {
      key: "type",
      label: "Type",
      type: "select",
      required: true,
      options: [
        { value: "break", label: "Break duty" },
        { value: "lunch", label: "Lunch duty" },
        { value: "boarding", label: "Boarding duty" },
        { value: "other", label: "Other" },
      ],
    },
    { key: "location", label: "Location", type: "text" },
    { key: "specificDate", label: "One-off date (leave blank if recurring weekly)", type: "date" },
    { key: "notes", label: "Notes", type: "textarea", span: 2 },
  ];

  async function submit(values: Record<string, unknown>) {
    const payload = { ...values, dayOfWeek: Number(values.dayOfWeek) };
    if (modal?.editing) await api.put(`/duty-rota/${modal.editing.id}`, payload);
    else await api.post("/duty-rota", payload);
    setModal(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this duty entry?")) return;
    await api.del(`/duty-rota/${id}`);
    load();
  }

  return (
    <div className="card p-4">
      <div className="flex justify-end mb-3">
        <button className="btn-primary" onClick={() => setModal({ editing: null })}>
          + Add duty
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-ink-500 border-b border-ink-100">
            <th className="py-2 font-medium">Day</th>
            <th className="py-2 font-medium">Time</th>
            <th className="py-2 font-medium">Type</th>
            <th className="py-2 font-medium">Location</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-b border-ink-50">
              <td className="py-2">{DAY_NAME[e.dayOfWeek]}{e.specificDate ? ` (${formatDate(e.specificDate)})` : ""}</td>
              <td className="py-2">{e.startTime}–{e.endTime}</td>
              <td className="py-2 capitalize">{e.type}</td>
              <td className="py-2">{e.location ?? "—"}</td>
              <td className="py-2 text-right">
                <button className="text-xs text-ink-400 hover:text-brand-700 mr-3" onClick={() => setModal({ editing: { ...e, dayOfWeek: String(e.dayOfWeek) } })}>
                  Edit
                </button>
                <button className="text-xs text-ink-400 hover:text-red-600" onClick={() => remove(e.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-ink-400">
                No duties added yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {modal && (
        <Modal title={modal.editing ? "Edit duty" : "Add duty"} onClose={() => setModal(null)}>
          <ResourceForm fields={fields} initial={modal.editing ?? undefined} onCancel={() => setModal(null)} onSubmit={submit} />
        </Modal>
      )}
    </div>
  );
}

function TutorGroupTab() {
  const [groups, setGroups] = useState<any[]>([]);
  const [pupils, setPupils] = useState<any[]>([]);
  const [modal, setModal] = useState(false);

  async function load() {
    const [g, p] = await Promise.all([api.get<any[]>("/tutor-groups"), api.get<any[]>("/pupils")]);
    setGroups(g);
    setPupils(p);
  }
  useEffect(() => {
    load();
  }, []);

  const fields: FieldDef[] = [
    { key: "name", label: "Tutor group name", type: "text", required: true },
    { key: "academicYear", label: "Academic year", type: "text", required: true },
  ];

  async function addGroup(values: Record<string, unknown>) {
    await api.post("/tutor-groups", values);
    setModal(false);
    load();
  }

  function nextBirthdayOrder(dob: string) {
    const d = new Date(dob);
    const now = new Date();
    const next = new Date(now.getFullYear(), d.getMonth(), d.getDate());
    if (next < new Date(now.getFullYear(), now.getMonth(), now.getDate())) next.setFullYear(now.getFullYear() + 1);
    return next.getTime();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setModal(true)}>
          + Add tutor group
        </button>
      </div>
      {groups.map((g) => {
        const groupPupils = pupils
          .filter((p) => p.tutorGroupId === g.id)
          .slice()
          .sort((a, b) => {
            if (!a.dob) return 1;
            if (!b.dob) return -1;
            return nextBirthdayOrder(a.dob) - nextBirthdayOrder(b.dob);
          });
        return (
          <div key={g.id} className="card p-4">
            <h3 className="font-semibold text-ink-900 mb-2">
              {g.name} <span className="text-xs text-ink-400 font-normal">· {g.academicYear}</span>
            </h3>
            {groupPupils.length === 0 ? (
              <p className="text-sm text-ink-400">No pupils assigned yet — add tutor group on the Pupils page.</p>
            ) : (
              <ul className="divide-y divide-ink-50">
                {groupPupils.map((p) => (
                  <li key={p.id} className="py-1.5 flex items-center justify-between text-sm">
                    <span className="text-ink-800">
                      {p.firstName} {p.lastName}
                    </span>
                    <span className="text-xs text-ink-400">{p.dob ? `Birthday: ${formatDate(p.dob)}` : "No DOB set"}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
      {groups.length === 0 && <p className="text-sm text-ink-400">No tutor groups yet.</p>}

      {modal && (
        <Modal title="Add tutor group" onClose={() => setModal(false)}>
          <ResourceForm fields={fields} onCancel={() => setModal(false)} onSubmit={addGroup} />
        </Modal>
      )}
    </div>
  );
}

function PastoralNotesTab() {
  const [notes, setNotes] = useState<any[]>([]);
  const [pupils, setPupils] = useState<any[]>([]);
  const [modal, setModal] = useState(false);

  async function load() {
    const [n, p] = await Promise.all([api.get<any[]>("/pastoral-notes"), api.get<any[]>("/pupils")]);
    setNotes(n);
    setPupils(p);
  }
  useEffect(() => {
    load();
  }, []);

  const fields: FieldDef[] = [
    { key: "pupilId", label: "Pupil", type: "select", required: true, options: pupils.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName}` })) },
    { key: "date", label: "Date", type: "date", required: true },
    { key: "note", label: "Note", type: "textarea", required: true, span: 2 },
  ];

  async function submit(values: Record<string, unknown>) {
    await api.post("/pastoral-notes", values);
    setModal(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this pastoral note?")) return;
    await api.del(`/pastoral-notes/${id}`);
    load();
  }

  return (
    <div>
      <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2 mb-3">
        Private — pastoral notes are kept separate from academic records.
      </div>
      <div className="flex justify-end mb-3">
        <button className="btn-primary" onClick={() => setModal(true)}>
          + Add note
        </button>
      </div>
      <ul className="space-y-2">
        {notes.map((n) => (
          <li key={n.id} className="card p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-ink-900">
                {n.pupil.firstName} {n.pupil.lastName}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-400">{formatDate(n.date)}</span>
                <button className="text-xs text-ink-400 hover:text-red-600" onClick={() => remove(n.id)}>
                  Delete
                </button>
              </div>
            </div>
            <p className="text-sm text-ink-700">{n.note}</p>
          </li>
        ))}
        {notes.length === 0 && <p className="text-sm text-ink-400">No pastoral notes yet.</p>}
      </ul>

      {modal && (
        <Modal title="Add pastoral note" onClose={() => setModal(false)}>
          <ResourceForm fields={fields} onCancel={() => setModal(false)} onSubmit={submit} />
        </Modal>
      )}
    </div>
  );
}

function CommsLogTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [pupils, setPupils] = useState<any[]>([]);
  const [modal, setModal] = useState(false);

  async function load() {
    const [l, p] = await Promise.all([api.get<any[]>("/comms-log"), api.get<any[]>("/pupils")]);
    setLogs(l);
    setPupils(p);
  }
  useEffect(() => {
    load();
  }, []);

  const fields: FieldDef[] = [
    { key: "pupilId", label: "Pupil", type: "select", required: true, options: pupils.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName}` })) },
    { key: "date", label: "Date", type: "date", required: true },
    {
      key: "method",
      label: "Method",
      type: "select",
      required: true,
      options: [
        { value: "phone", label: "Phone" },
        { value: "email", label: "Email" },
        { value: "in-person", label: "In person" },
        { value: "letter", label: "Letter" },
      ],
    },
    { key: "summary", label: "Summary", type: "textarea", required: true, span: 2 },
  ];

  async function submit(values: Record<string, unknown>) {
    await api.post("/comms-log", values);
    setModal(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this log entry?")) return;
    await api.del(`/comms-log/${id}`);
    load();
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button className="btn-primary" onClick={() => setModal(true)}>
          + Log communication
        </button>
      </div>
      <ul className="space-y-2">
        {logs.map((l) => (
          <li key={l.id} className="card p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-ink-900">
                {l.pupil.firstName} {l.pupil.lastName} <span className="text-ink-400 font-normal capitalize">· {l.method}</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-400">{formatDate(l.date)}</span>
                <button className="text-xs text-ink-400 hover:text-red-600" onClick={() => remove(l.id)}>
                  Delete
                </button>
              </div>
            </div>
            <p className="text-sm text-ink-700 mb-2">{l.summary}</p>
            <AiPromptButton label="Draft follow-up email" endpoint="/ai-prompts/parent-email" body={{ commsLogId: l.id }} />
          </li>
        ))}
        {logs.length === 0 && <p className="text-sm text-ink-400">No communications logged yet.</p>}
      </ul>

      {modal && (
        <Modal title="Log parent communication" onClose={() => setModal(false)}>
          <ResourceForm fields={fields} onCancel={() => setModal(false)} onSubmit={submit} />
        </Modal>
      )}
    </div>
  );
}
