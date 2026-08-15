import { ReactNode, useEffect, useState } from "react";
import { api } from "../lib/api";
import { Modal } from "./Modal";
import { FieldDef, ResourceForm } from "./ResourceForm";

export interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
}

export function CrudPage<T extends { id: string }>({
  title,
  description,
  apiPath,
  fields,
  columns,
  emptyLabel = "Nothing here yet.",
  addLabel = "Add",
}: {
  title: string;
  description?: string;
  apiPath: string;
  fields: FieldDef[];
  columns: ColumnDef<T>[];
  emptyLabel?: string;
  addLabel?: string;
}) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);

  async function load() {
    setLoading(true);
    const data = await api.get<T[]>(apiPath);
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiPath]);

  async function handleSubmit(values: Record<string, unknown>) {
    if (editing) {
      await api.put(`${apiPath}/${editing.id}`, values);
    } else {
      await api.post(apiPath, values);
    }
    setModalOpen(false);
    setEditing(null);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    await api.del(`${apiPath}/${id}`);
    await load();
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">{title}</h1>
          {description && <p className="text-sm text-ink-500 mt-0.5">{description}</p>}
        </div>
        <button
          className="btn-primary shrink-0"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          + {addLabel}
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-ink-400">Loading…</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-ink-400">{emptyLabel}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-ink-500">
                  {columns.map((c) => (
                    <th key={c.key} className="px-4 py-2.5 font-medium">
                      {c.label}
                    </th>
                  ))}
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60">
                    {columns.map((c) => (
                      <td key={c.key} className="px-4 py-2.5 text-ink-800">
                        {c.render ? c.render(row) : String((row as any)[c.key] ?? "")}
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <button
                        className="text-ink-400 hover:text-brand-700 text-xs font-medium mr-3"
                        onClick={() => {
                          setEditing(row);
                          setModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="text-ink-400 hover:text-red-600 text-xs font-medium"
                        onClick={() => handleDelete(row.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal
          title={editing ? `Edit ${title.replace(/s$/, "")}` : addLabel}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
        >
          <ResourceForm
            fields={fields}
            initial={editing ?? undefined}
            onCancel={() => {
              setModalOpen(false);
              setEditing(null);
            }}
            onSubmit={handleSubmit}
          />
        </Modal>
      )}
    </div>
  );
}
