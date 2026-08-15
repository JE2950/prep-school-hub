import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { formatDate } from "../../lib/dates";
import { Modal } from "../../components/Modal";
import { FieldDef, ResourceForm } from "../../components/ResourceForm";
import { AiPromptButton } from "../../components/AiPromptPanel";

type Tab = "squad" | "training" | "fixtures" | "kit";

export function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("squad");

  async function load() {
    setTeam(await api.get(`/teams/${teamId}`));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  if (!team) return <p className="text-sm text-ink-400">Loading…</p>;

  return (
    <div>
      <Link to="/co-curricular" className="text-xs text-ink-400 hover:text-brand-700">
        ← All teams
      </Link>
      <h1 className="text-2xl font-semibold text-ink-900 mt-1 mb-4">
        {team.name} <span className="text-ink-400 font-normal">· {team.sport}</span>
      </h1>

      <div className="flex gap-1 border-b border-ink-200 mb-4 overflow-x-auto">
        {(
          [
            ["squad", "Squad"],
            ["training", "Training"],
            ["fixtures", "Fixtures & results"],
            ["kit", "Kit checklist"],
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

      {tab === "squad" && <SquadTab team={team} onChange={load} />}
      {tab === "training" && <TrainingTab team={team} onChange={load} />}
      {tab === "fixtures" && <FixturesTab team={team} onChange={load} />}
      {tab === "kit" && <KitTab team={team} onChange={load} />}
    </div>
  );
}

function SquadTab({ team, onChange }: { team: any; onChange: () => void }) {
  const [allPupils, setAllPupils] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    api.get<any[]>("/pupils").then(setAllPupils);
  }, []);

  const squadIds = new Set(team.pupils.map((tp: any) => tp.pupilId));
  const available = allPupils.filter((p) => !squadIds.has(p.id));

  async function add() {
    if (!selected) return;
    await api.post("/team-pupils", { teamId: team.id, pupilId: selected });
    setSelected("");
    setAdding(false);
    onChange();
  }

  async function remove(id: string) {
    await api.del(`/team-pupils/${id}`);
    onChange();
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-ink-900">Squad ({team.pupils.length})</h2>
        <button className="btn-secondary" onClick={() => setAdding(true)}>
          + Add pupil
        </button>
      </div>
      <ul className="divide-y divide-ink-50">
        {team.pupils.map((tp: any) => (
          <li key={tp.id} className="py-2 flex items-center justify-between text-sm">
            <span className="text-ink-800">
              {tp.pupil.firstName} {tp.pupil.lastName}
            </span>
            <button className="text-xs text-ink-400 hover:text-red-600" onClick={() => remove(tp.id)}>
              Remove
            </button>
          </li>
        ))}
        {team.pupils.length === 0 && <p className="text-sm text-ink-400 py-2">No squad members yet.</p>}
      </ul>

      {adding && (
        <Modal title="Add to squad" onClose={() => setAdding(false)}>
          <div className="space-y-3">
            <select className="input" value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">Select a pupil…</option>
              {available.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setAdding(false)}>
                Cancel
              </button>
              <button className="btn-primary" disabled={!selected} onClick={add}>
                Add
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TrainingTab({ team, onChange }: { team: any; onChange: () => void }) {
  const [modal, setModal] = useState(false);
  const DAY_NAME: Record<number, string> = { 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday", 7: "Sunday" };

  const fields: FieldDef[] = [
    {
      key: "dayOfWeek",
      label: "Day",
      type: "select",
      required: true,
      options: Object.entries(DAY_NAME).map(([v, l]) => ({ value: v, label: l })),
    },
    { key: "startTime", label: "Start time", type: "time", required: true },
    { key: "endTime", label: "End time", type: "time", required: true },
    { key: "location", label: "Location", type: "text" },
  ];

  async function submit(values: Record<string, unknown>) {
    await api.post("/training-sessions", { ...values, teamId: team.id, dayOfWeek: Number(values.dayOfWeek) });
    setModal(false);
    onChange();
  }

  async function remove(id: string) {
    await api.del(`/training-sessions/${id}`);
    onChange();
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-ink-900">Training schedule</h2>
        <button className="btn-primary" onClick={() => setModal(true)}>
          + Add session
        </button>
      </div>
      <ul className="space-y-1.5">
        {team.training.map((t: any) => (
          <li key={t.id} className="flex items-center justify-between text-sm px-1">
            <span>{DAY_NAME[t.dayOfWeek]} {t.startTime}–{t.endTime}{t.location ? ` · ${t.location}` : ""}</span>
            <button className="text-xs text-ink-400 hover:text-red-600" onClick={() => remove(t.id)}>
              Delete
            </button>
          </li>
        ))}
        {team.training.length === 0 && <p className="text-sm text-ink-400">No training sessions set.</p>}
      </ul>

      {modal && (
        <Modal title="Add training session" onClose={() => setModal(false)}>
          <ResourceForm fields={fields} onCancel={() => setModal(false)} onSubmit={submit} />
        </Modal>
      )}
    </div>
  );
}

function FixturesTab({ team, onChange }: { team: any; onChange: () => void }) {
  const [modal, setModal] = useState<{ editing: any | null } | null>(null);

  const fields: FieldDef[] = [
    { key: "date", label: "Date", type: "date", required: true },
    { key: "opponent", label: "Opponent", type: "text", required: true },
    {
      key: "homeAway",
      label: "Home / away",
      type: "select",
      required: true,
      options: [
        { value: "home", label: "Home" },
        { value: "away", label: "Away" },
      ],
    },
    { key: "venue", label: "Venue", type: "text" },
    {
      key: "result",
      label: "Result",
      type: "select",
      options: [
        { value: "W", label: "Win" },
        { value: "L", label: "Loss" },
        { value: "D", label: "Draw" },
        { value: "postponed", label: "Postponed" },
        { value: "tbc", label: "TBC" },
      ],
    },
    { key: "scoreSummary", label: "Score summary", type: "text" },
    { key: "matchReportDraft", label: "Quick notes for match report", type: "textarea", span: 2 },
  ];

  async function submit(values: Record<string, unknown>) {
    if (modal?.editing) await api.put(`/fixtures/${modal.editing.id}`, values);
    else await api.post("/fixtures", { ...values, teamId: team.id });
    setModal(null);
    onChange();
  }

  async function remove(id: string) {
    if (!confirm("Delete this fixture?")) return;
    await api.del(`/fixtures/${id}`);
    onChange();
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-ink-900">Fixtures & results</h2>
        <button className="btn-primary" onClick={() => setModal({ editing: null })}>
          + Add fixture
        </button>
      </div>
      <div className="space-y-3">
        {team.fixtures.map((f: any) => (
          <div key={f.id} className="rounded-lg border border-ink-100 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-ink-900">
                {f.homeAway === "home" ? "vs" : "@"} {f.opponent}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-400">{formatDate(f.date)}</span>
                <button className="text-xs text-ink-400 hover:text-brand-700" onClick={() => setModal({ editing: f })}>
                  Edit
                </button>
                <button className="text-xs text-ink-400 hover:text-red-600" onClick={() => remove(f.id)}>
                  Delete
                </button>
              </div>
            </div>
            <p className="text-xs text-ink-500 mb-2">
              {f.venue ?? "Venue TBC"} {f.result ? `· Result: ${f.result}` : ""} {f.scoreSummary ? `· ${f.scoreSummary}` : ""}
            </p>
            <AiPromptButton label="Draft match report" endpoint="/ai-prompts/match-report" body={{ fixtureId: f.id }} />
          </div>
        ))}
        {team.fixtures.length === 0 && <p className="text-sm text-ink-400">No fixtures added yet.</p>}
      </div>

      {modal && (
        <Modal title={modal.editing ? "Edit fixture" : "Add fixture"} onClose={() => setModal(null)}>
          <ResourceForm fields={fields} initial={modal.editing ?? undefined} onCancel={() => setModal(null)} onSubmit={submit} />
        </Modal>
      )}
    </div>
  );
}

function KitTab({ team, onChange }: { team: any; onChange: () => void }) {
  const [item, setItem] = useState("");
  const [season, setSeason] = useState("");

  async function add() {
    if (!item.trim()) return;
    await api.post("/kit-items", { teamId: team.id, item, season: season || null, checked: false });
    setItem("");
    onChange();
  }

  async function toggle(k: any) {
    await api.put(`/kit-items/${k.id}`, { checked: !k.checked });
    onChange();
  }

  async function remove(id: string) {
    await api.del(`/kit-items/${id}`);
    onChange();
  }

  return (
    <div className="card p-4">
      <h2 className="text-sm font-semibold text-ink-900 mb-3">Kit & equipment checklist</h2>
      <div className="flex gap-2 mb-3">
        <input className="input" placeholder="e.g. Match balls" value={item} onChange={(e) => setItem(e.target.value)} />
        <input className="input !w-32" placeholder="Season" value={season} onChange={(e) => setSeason(e.target.value)} />
        <button className="btn-primary shrink-0" onClick={add}>
          Add
        </button>
      </div>
      <ul className="space-y-1.5">
        {team.kitItems.map((k: any) => (
          <li key={k.id} className="flex items-center gap-2.5 px-1">
            <input type="checkbox" checked={k.checked} onChange={() => toggle(k)} />
            <span className={`text-sm flex-1 ${k.checked ? "line-through text-ink-400" : "text-ink-800"}`}>
              {k.item} {k.season ? <span className="text-xs text-ink-400">({k.season})</span> : null}
            </span>
            <button className="text-xs text-ink-400 hover:text-red-600" onClick={() => remove(k.id)}>
              Delete
            </button>
          </li>
        ))}
        {team.kitItems.length === 0 && <p className="text-sm text-ink-400">No kit items listed yet.</p>}
      </ul>
    </div>
  );
}
