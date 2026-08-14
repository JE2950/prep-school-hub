import { useState } from "react";
import { Modal } from "./Modal";
import { api } from "../lib/api";

const CATEGORIES = ["academic", "sport", "pastoral", "admin", "personal"];

export function QuickAddModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"task" | "note">("task");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      if (mode === "task") {
        await api.post("/tasks", {
          title,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          category: category || null,
          done: false,
        });
      } else {
        await api.post("/notes", { title: title || null, content, date: new Date().toISOString() });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Quick add" onClose={onClose}>
      <div className="flex gap-2 mb-3">
        <button
          className={mode === "task" ? "btn-primary" : "btn-secondary"}
          onClick={() => setMode("task")}
        >
          Task
        </button>
        <button
          className={mode === "note" ? "btn-primary" : "btn-secondary"}
          onClick={() => setMode("note")}
        >
          Note
        </button>
      </div>

      {mode === "task" ? (
        <div className="space-y-3">
          <div>
            <label className="label">What needs doing?</label>
            <input
              className="input"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chase 7L1 prep books"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Due date (optional)</label>
              <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">None</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c[0].toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="label">Title (optional)</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="label">Note</label>
            <textarea
              className="input min-h-[100px]"
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <button className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn-primary"
          disabled={saving || (mode === "task" ? !title : !content)}
          onClick={save}
        >
          {saving ? "Saving…" : "Add"}
        </button>
      </div>
    </Modal>
  );
}
