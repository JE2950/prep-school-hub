import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Modal } from "./Modal";

interface QuickLink {
  id: string;
  label: string;
  url: string;
  order: number;
}

const PRESETS = ["CPOMS", "iSAMS", "SOCS"];

function normaliseUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function QuickLinksPanel() {
  const [links, setLinks] = useState<QuickLink[] | null>(null);
  const [managing, setManaging] = useState(false);
  const [modal, setModal] = useState<{ editing: QuickLink | null } | null>(null);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  async function load() {
    setLinks(await api.get<QuickLink[]>("/quick-links"));
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd(preset?: string) {
    setLabel(preset ?? "");
    setUrl("");
    setModal({ editing: null });
  }

  function openEdit(link: QuickLink) {
    setLabel(link.label);
    setUrl(link.url);
    setModal({ editing: link });
  }

  async function save() {
    const payload = { label: label.trim(), url: normaliseUrl(url), order: modal?.editing?.order ?? links?.length ?? 0 };
    if (!payload.label || !payload.url) return;
    if (modal?.editing) {
      await api.put(`/quick-links/${modal.editing.id}`, payload);
    } else {
      await api.post("/quick-links", payload);
    }
    setModal(null);
    load();
  }

  async function remove(id: string) {
    await api.del(`/quick-links/${id}`);
    load();
  }

  if (!links) return null;

  const existingLabels = new Set(links.map((l) => l.label.toLowerCase()));
  const missingPresets = PRESETS.filter((p) => !existingLabels.has(p.toLowerCase()));

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-ink-900">Quick links</h2>
        <button className="text-xs text-brand-700 hover:underline" onClick={() => setManaging((m) => !m)}>
          {managing ? "Done" : "Manage"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <div key={link.id} className="flex items-center">
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary border-brand-200 text-brand-800 hover:bg-brand-50"
            >
              {link.label} ↗
            </a>
            {managing && (
              <span className="flex items-center gap-1 ml-1">
                <button className="text-xs text-ink-400 hover:text-brand-700 px-1" onClick={() => openEdit(link)}>
                  Edit
                </button>
                <button className="text-xs text-ink-400 hover:text-red-600 px-1" onClick={() => remove(link.id)}>
                  Remove
                </button>
              </span>
            )}
          </div>
        ))}

        {missingPresets.map((preset) => (
          <button key={preset} className="btn-ghost border border-dashed border-ink-200" onClick={() => openAdd(preset)}>
            + {preset}
          </button>
        ))}
        <button className="btn-ghost border border-dashed border-ink-200" onClick={() => openAdd()}>
          + Add link
        </button>
      </div>

      {links.length === 0 && (
        <p className="text-xs text-ink-400 mt-2">
          Add links to systems you use daily — CPOMS, iSAMS, SOCS or anything else — each school's URL is
          different so you'll need to paste in your own.
        </p>
      )}

      {modal && (
        <Modal title={modal.editing ? "Edit link" : "Add link"} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="label">Label</label>
              <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. CPOMS" />
            </div>
            <div>
              <label className="label">URL</label>
              <input
                className="input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g. yourschool.cpoms.co.uk"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button className="btn-secondary" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={save} disabled={!label.trim() || !url.trim()}>
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
