import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { Modal } from "../../components/Modal";
import { FieldDef, ResourceForm } from "../../components/ResourceForm";

interface ClassItem {
  id: string;
  name: string;
  subject: string;
  yearGroup: string | null;
  currentTopic: string | null;
  pupils: any[];
}

const classFields: FieldDef[] = [
  { key: "name", label: "Class / set name (e.g. 7L1)", type: "text", required: true },
  { key: "subject", label: "Subject", type: "text", required: true },
  { key: "yearGroup", label: "Year group", type: "text" },
  { key: "currentTopic", label: "Current topic", type: "text", span: 2 },
  { key: "notes", label: "Notes", type: "textarea", span: 2 },
];

export function ClassesListPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  async function load() {
    setClasses(await api.get<ClassItem[]>("/classes"));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(values: Record<string, unknown>) {
    await api.post("/classes", values);
    setModalOpen(false);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Classes</h1>
          <p className="text-sm text-ink-500 mt-0.5">Every set you teach, across all subjects.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/classes/timetable" className="btn-secondary">
            Timetable builder
          </Link>
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            + Add class
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {classes.map((c) => (
          <Link key={c.id} to={`/classes/${c.id}`} className="card p-4 hover:border-brand-300 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-ink-900">{c.name}</h3>
              <span className="badge bg-ink-100 text-ink-600">{c.pupils.length} pupils</span>
            </div>
            <p className="text-sm text-ink-500">{c.subject}{c.yearGroup ? ` · Year ${c.yearGroup}` : ""}</p>
            {c.currentTopic && <p className="text-xs text-ink-400 mt-2 truncate">Topic: {c.currentTopic}</p>}
          </Link>
        ))}
        {classes.length === 0 && <p className="text-sm text-ink-400">No classes yet — add your first one.</p>}
      </div>

      {modalOpen && (
        <Modal title="Add class" onClose={() => setModalOpen(false)}>
          <ResourceForm fields={classFields} onCancel={() => setModalOpen(false)} onSubmit={handleSubmit} />
        </Modal>
      )}
    </div>
  );
}
