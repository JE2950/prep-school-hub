import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Modal } from "../components/Modal";
import { FieldDef, ResourceForm } from "../components/ResourceForm";
import { AiPromptButton } from "../components/AiPromptPanel";

interface Goal {
  id: string;
  title: string;
  category: string;
  academicYear: string | null;
  term: string | null;
  progress: number;
  status: string;
  notes: string | null;
}

const CATEGORY_LABEL: Record<string, string> = {
  professional: "Professional",
  departmental: "Departmental",
  pastoral: "Pastoral",
  personal: "Personal",
};

const fields: FieldDef[] = [
  { key: "title", label: "Goal", type: "text", required: true, span: 2 },
  {
    key: "category",
    label: "Category",
    type: "select",
    required: true,
    options: Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label })),
  },
  {
    key: "term",
    label: "Term",
    type: "select",
    options: [
      { value: "Michaelmas", label: "Michaelmas" },
      { value: "Lent", label: "Lent" },
      { value: "Summer", label: "Summer" },
    ],
  },
  { key: "academicYear", label: "Academic year", type: "text" },
  { key: "progress", label: "Progress (0-100)", type: "number" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "not-started", label: "Not started" },
      { value: "in-progress", label: "In progress" },
      { value: "done", label: "Done" },
    ],
  },
  { key: "notes", label: "Notes", type: "textarea", span: 2 },
];

export function PlanningGoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [modal, setModal] = useState<{ editing: Goal | null } | null>(null);

  async function load() {
    setGoals(await api.get<Goal[]>("/termly-goals"));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(values: Record<string, unknown>) {
    if (modal?.editing) {
      await api.put(`/termly-goals/${modal.editing.id}`, values);
    } else {
      await api.post("/termly-goals", values);
    }
    setModal(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this goal?")) return;
    await api.del(`/termly-goals/${id}`);
    load();
  }

  const visible = filter ? goals.filter((g) => g.category === filter) : goals;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Planning & goals</h1>
          <p className="text-sm text-ink-500 mt-0.5">Termly goals across professional, departmental, pastoral and personal.</p>
        </div>
        <div className="flex items-center gap-2">
          <AiPromptButton label="Weekly to-do list" endpoint="/ai-prompts/weekly-todo" body={{}} />
          <button className="btn-primary" onClick={() => setModal({ editing: null })}>
            + Add goal
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button className={!filter ? "btn-primary" : "btn-secondary"} onClick={() => setFilter("")}>
          All
        </button>
        {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
          <button key={value} className={filter === value ? "btn-primary" : "btn-secondary"} onClick={() => setFilter(value)}>
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.map((g) => (
          <div key={g.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge bg-ink-100 text-ink-600">{CATEGORY_LABEL[g.category]}</span>
                  {g.term && <span className="badge bg-brand-50 text-brand-700">{g.term} {g.academicYear}</span>}
                </div>
                <p className="text-sm font-medium text-ink-900">{g.title}</p>
                {g.notes && <p className="text-xs text-ink-500 mt-1">{g.notes}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button className="text-xs text-ink-400 hover:text-brand-700" onClick={() => setModal({ editing: g })}>
                  Edit
                </button>
                <button className="text-xs text-ink-400 hover:text-red-600" onClick={() => remove(g.id)}>
                  Delete
                </button>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-ink-100 overflow-hidden">
                <div className="h-full bg-brand-500" style={{ width: `${g.progress}%` }} />
              </div>
              <span className="text-xs text-ink-500 w-10 text-right">{g.progress}%</span>
            </div>
          </div>
        ))}
        {visible.length === 0 && <p className="text-sm text-ink-400">No goals yet.</p>}
      </div>

      {modal && (
        <Modal title={modal.editing ? "Edit goal" : "Add goal"} onClose={() => setModal(null)}>
          <ResourceForm fields={fields} initial={modal.editing ?? { progress: 0, status: "in-progress" }} onCancel={() => setModal(null)} onSubmit={handleSubmit} />
        </Modal>
      )}
    </div>
  );
}
