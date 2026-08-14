import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { daysUntil, formatDate } from "../lib/dates";
import { Modal } from "../components/Modal";
import { CrudPage } from "../components/CrudPage";
import { FieldDef } from "../components/ResourceForm";

type Tab = "cpd" | "qualifications" | "career";

export function CpdCareerPage() {
  const [tab, setTab] = useState<Tab>("cpd");

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink-900 mb-4">Professional development & career</h1>
      <div className="flex gap-1 border-b border-ink-200 mb-4 overflow-x-auto">
        {(
          [
            ["cpd", "CPD log"],
            ["qualifications", "Qualifications & renewals"],
            ["career", "Career goals"],
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

      {tab === "cpd" && <CpdTab />}
      {tab === "qualifications" && <QualificationsTab />}
      {tab === "career" && <CareerTab />}
    </div>
  );
}

function FileUpload({ onUploaded, existing }: { onUploaded: (filename: string) => void; existing?: string | null }) {
  const [uploading, setUploading] = useState(false);
  return (
    <div>
      <label className="label">Certificate / evidence file (optional)</label>
      {existing && (
        <a href={`/uploads/${existing}`} target="_blank" rel="noreferrer" className="text-xs text-brand-700 hover:underline block mb-1">
          View current file
        </a>
      )}
      <input
        type="file"
        className="text-sm"
        disabled={uploading}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setUploading(true);
          const fd = new FormData();
          fd.append("file", file);
          const res = await api.upload<{ filename: string }>("/uploads", fd);
          onUploaded(res.filename);
          setUploading(false);
        }}
      />
      {uploading && <p className="text-xs text-ink-400 mt-1">Uploading…</p>}
    </div>
  );
}

function CpdTab() {
  const [entries, setEntries] = useState<any[]>([]);
  const [modal, setModal] = useState<{ editing: any | null } | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  async function load() {
    setEntries(await api.get("/cpd-entries"));
  }
  useEffect(() => {
    load();
  }, []);

  function openModal(editing: any | null) {
    setForm(
      editing
        ? { ...editing, date: editing.date?.slice(0, 10) }
        : { title: "", provider: "", date: new Date().toISOString().slice(0, 10), hours: "", reflection: "", certificateFile: null }
    );
    setModal({ editing });
  }

  async function submit() {
    const payload = { ...form, hours: form.hours === "" ? null : Number(form.hours), date: new Date(form.date).toISOString() };
    if (modal?.editing) await api.put(`/cpd-entries/${modal.editing.id}`, payload);
    else await api.post("/cpd-entries", payload);
    setModal(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this CPD entry?")) return;
    await api.del(`/cpd-entries/${id}`);
    load();
  }

  return (
    <div>
      <div className="flex justify-end gap-2 mb-3">
        <a className="btn-secondary" href="/api/exports/cpd.csv" target="_blank" rel="noreferrer">
          Export CSV
        </a>
        <button className="btn-primary" onClick={() => openModal(null)}>
          + Add CPD entry
        </button>
      </div>
      <div className="space-y-2">
        {entries.map((e) => (
          <div key={e.id} className="card p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-ink-900">{e.title}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-400">{formatDate(e.date)}</span>
                <button className="text-xs text-ink-400 hover:text-brand-700" onClick={() => openModal(e)}>
                  Edit
                </button>
                <button className="text-xs text-ink-400 hover:text-red-600" onClick={() => remove(e.id)}>
                  Delete
                </button>
              </div>
            </div>
            <p className="text-xs text-ink-500">
              {e.provider ?? "—"} {e.hours ? `· ${e.hours}h` : ""}
              {e.certificateFile && (
                <>
                  {" · "}
                  <a href={`/uploads/${e.certificateFile}`} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">
                    Certificate
                  </a>
                </>
              )}
            </p>
            {e.reflection && <p className="text-sm text-ink-700 mt-1">{e.reflection}</p>}
          </div>
        ))}
        {entries.length === 0 && <p className="text-sm text-ink-400">No CPD logged yet.</p>}
      </div>

      {modal && (
        <Modal title={modal.editing ? "Edit CPD entry" : "Add CPD entry"} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="label">Title</label>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Provider</label>
                <input className="input" value={form.provider ?? ""} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
              </div>
              <div>
                <label className="label">Hours</label>
                <input className="input" type="number" value={form.hours ?? ""} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="label">Reflection</label>
              <textarea className="input min-h-[80px]" value={form.reflection ?? ""} onChange={(e) => setForm({ ...form, reflection: e.target.value })} />
            </div>
            <FileUpload existing={form.certificateFile} onUploaded={(f) => setForm({ ...form, certificateFile: f })} />
            <div className="flex justify-end gap-2 pt-2">
              <button className="btn-secondary" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={submit} disabled={!form.title}>
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function QualificationsTab() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    api.get<any[]>("/qualifications").then(setItems);
  }, []);

  const fields: FieldDef[] = [
    { key: "name", label: "Qualification / certification", type: "text", required: true, span: 2 },
    { key: "issuedDate", label: "Issued date", type: "date" },
    { key: "expiryDate", label: "Expiry date", type: "date" },
    { key: "reminderDays", label: "Remind me this many days before expiry", type: "number" },
    { key: "notes", label: "Notes", type: "textarea", span: 2 },
  ];

  const expiringSoon = items.filter((q) => {
    if (!q.expiryDate) return false;
    const d = daysUntil(q.expiryDate);
    return d !== null && d <= q.reminderDays && d >= 0;
  });
  const expired = items.filter((q) => q.expiryDate && (daysUntil(q.expiryDate) ?? 1) < 0);

  return (
    <div>
      {(expiringSoon.length > 0 || expired.length > 0) && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-4 text-sm text-amber-800">
          {expired.length > 0 && (
            <p className="font-medium">
              Expired: {expired.map((q) => q.name).join(", ")}
            </p>
          )}
          {expiringSoon.length > 0 && (
            <p>
              Renewal due soon: {expiringSoon.map((q) => `${q.name} (${formatDate(q.expiryDate)})`).join(", ")}
            </p>
          )}
        </div>
      )}
      <CrudPage
        title="Qualifications & certifications"
        apiPath="/qualifications"
        fields={fields}
        addLabel="Add qualification"
        columns={[
          { key: "name", label: "Name" },
          { key: "issuedDate", label: "Issued", render: (r: any) => formatDate(r.issuedDate) },
          { key: "expiryDate", label: "Expires", render: (r: any) => formatDate(r.expiryDate) },
        ]}
        emptyLabel="No qualifications tracked yet — add first aid, safeguarding, DBS, coaching awards, etc."
      />
    </div>
  );
}

function CareerTab() {
  const [items, setItems] = useState<any[]>([]);
  const [modal, setModal] = useState<{ editing: any | null } | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  async function load() {
    setItems(await api.get("/career-milestones"));
  }
  useEffect(() => {
    load();
  }, []);

  function openModal(editing: any | null) {
    setForm(
      editing
        ? { ...editing, date: editing.date?.slice(0, 10) }
        : { title: "", date: new Date().toISOString().slice(0, 10), description: "", evidenceFile: null }
    );
    setModal({ editing });
  }

  async function submit() {
    const payload = { ...form, date: new Date(form.date).toISOString() };
    if (modal?.editing) await api.put(`/career-milestones/${modal.editing.id}`, payload);
    else await api.post("/career-milestones", payload);
    setModal(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this milestone?")) return;
    await api.del(`/career-milestones/${id}`);
    load();
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button className="btn-primary" onClick={() => openModal(null)}>
          + Add milestone
        </button>
      </div>
      <div className="space-y-2">
        {items.map((m) => (
          <div key={m.id} className="card p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-ink-900">{m.title}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-400">{formatDate(m.date)}</span>
                <button className="text-xs text-ink-400 hover:text-brand-700" onClick={() => openModal(m)}>
                  Edit
                </button>
                <button className="text-xs text-ink-400 hover:text-red-600" onClick={() => remove(m.id)}>
                  Delete
                </button>
              </div>
            </div>
            {m.description && <p className="text-sm text-ink-700">{m.description}</p>}
            {m.evidenceFile && (
              <a href={`/uploads/${m.evidenceFile}`} target="_blank" rel="noreferrer" className="text-xs text-brand-700 hover:underline">
                View evidence
              </a>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-ink-400">No milestones logged yet — useful for appraisal and future applications.</p>}
      </div>

      {modal && (
        <Modal title={modal.editing ? "Edit milestone" : "Add milestone"} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="label">Title</label>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input min-h-[80px]" value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <FileUpload existing={form.evidenceFile} onUploaded={(f) => setForm({ ...form, evidenceFile: f })} />
            <div className="flex justify-end gap-2 pt-2">
              <button className="btn-secondary" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={submit} disabled={!form.title}>
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
