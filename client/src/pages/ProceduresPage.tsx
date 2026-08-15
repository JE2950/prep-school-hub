import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Modal } from "../components/Modal";
import { FieldDef, ResourceForm } from "../components/ResourceForm";

const CATEGORY_LABEL: Record<string, string> = {
  fire: "Fire procedure",
  lockdown: "Lockdown",
  medical: "Medical emergencies",
  safeguarding: "Safeguarding reporting",
  "key-locations": "Key locations & phone numbers",
  other: "Other",
};

const fields: FieldDef[] = [
  { key: "title", label: "Title", type: "text", required: true, span: 2 },
  {
    key: "category",
    label: "Category",
    type: "select",
    required: true,
    options: Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label })),
  },
  { key: "content", label: "Content", type: "textarea", required: true, span: 2 },
  { key: "order", label: "Order", type: "number" },
];

export function ProceduresPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [modal, setModal] = useState<{ editing: any | null } | null>(null);

  async function load() {
    setDocs(await api.get("/procedures"));
  }
  useEffect(() => {
    load();
  }, []);

  async function submit(values: Record<string, unknown>) {
    if (modal?.editing) await api.put(`/procedures/${modal.editing.id}`, values);
    else await api.post("/procedures", values);
    setModal(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this procedure entry?")) return;
    await api.del(`/procedures/${id}`);
    load();
  }

  const grouped = Object.keys(CATEGORY_LABEL).map((cat) => ({
    cat,
    docs: docs.filter((d) => d.category === cat).sort((a, b) => a.order - b.order),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Emergency & procedures reference</h1>
          <p className="text-sm text-ink-500 mt-0.5">A quick-reference for fire, lockdown, medical and safeguarding procedures.</p>
        </div>
        <button className="btn-primary" onClick={() => setModal({ editing: null })}>
          + Add entry
        </button>
      </div>

      <div className="space-y-5">
        {grouped.map(({ cat, docs: catDocs }) =>
          catDocs.length === 0 ? null : (
            <div key={cat}>
              <h2 className="text-sm font-semibold text-ink-700 mb-2">{CATEGORY_LABEL[cat]}</h2>
              <div className="space-y-2">
                {catDocs.map((d) => (
                  <div key={d.id} className="card p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="font-medium text-ink-900">{d.title}</h3>
                      <div className="flex items-center gap-2">
                        <button className="text-xs text-ink-400 hover:text-brand-700" onClick={() => setModal({ editing: d })}>
                          Edit
                        </button>
                        <button className="text-xs text-ink-400 hover:text-red-600" onClick={() => remove(d.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-ink-700 whitespace-pre-wrap">{d.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
        {docs.length === 0 && <p className="text-sm text-ink-400">Nothing added yet — populate this with your school's procedures.</p>}
      </div>

      {modal && (
        <Modal title={modal.editing ? "Edit entry" : "Add entry"} onClose={() => setModal(null)} wide>
          <ResourceForm fields={fields} initial={modal.editing ?? undefined} onCancel={() => setModal(null)} onSubmit={submit} />
        </Modal>
      )}
    </div>
  );
}
