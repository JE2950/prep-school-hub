import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { Modal } from "../../components/Modal";
import { FieldDef, ResourceForm } from "../../components/ResourceForm";

const fields: FieldDef[] = [
  { key: "name", label: "Team name (e.g. U11B Cricket)", type: "text", required: true },
  { key: "sport", label: "Sport", type: "text", required: true },
  {
    key: "season",
    label: "Season",
    type: "select",
    options: [
      { value: "Michaelmas", label: "Michaelmas" },
      { value: "Lent", label: "Lent" },
      { value: "Summer", label: "Summer" },
    ],
  },
];

export function TeamsListPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  async function load() {
    setTeams(await api.get("/teams"));
  }
  useEffect(() => {
    load();
  }, []);

  async function submit(values: Record<string, unknown>) {
    await api.post("/teams", values);
    setModalOpen(false);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Co-curricular & sport</h1>
          <p className="text-sm text-ink-500 mt-0.5">Squads, training, fixtures and kit — all in one place.</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          + Add team
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {teams.map((t) => (
          <Link key={t.id} to={`/co-curricular/${t.id}`} className="card p-4 hover:border-brand-300">
            <h3 className="font-semibold text-ink-900">{t.name}</h3>
            <p className="text-sm text-ink-500">{t.sport}{t.season ? ` · ${t.season}` : ""}</p>
            <p className="text-xs text-ink-400 mt-2">{t.pupils.length} squad · {t.fixtures.length} fixtures</p>
          </Link>
        ))}
        {teams.length === 0 && <p className="text-sm text-ink-400">No teams added yet.</p>}
      </div>

      {modalOpen && (
        <Modal title="Add team" onClose={() => setModalOpen(false)}>
          <ResourceForm fields={fields} onCancel={() => setModalOpen(false)} onSubmit={submit} />
        </Modal>
      )}
    </div>
  );
}
