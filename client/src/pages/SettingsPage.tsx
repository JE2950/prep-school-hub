import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { Modal } from "../components/Modal";

export function SettingsPage() {
  const { teacherName, schoolName } = useAuth();
  const [currentPasscode, setCurrentPasscode] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (newPasscode !== confirmPasscode) return setError("New passcodes don't match.");
    try {
      await api.post("/auth/change-passcode", { currentPasscode, newPasscode });
      setMessage("Passcode updated.");
      setCurrentPasscode("");
      setNewPasscode("");
      setConfirmPasscode("");
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold text-ink-900 mb-4">Settings</h1>

      <div className="card p-4 mb-4">
        <p className="text-sm text-ink-700">
          <span className="font-medium">{teacherName}</span>
          <br />
          <span className="text-ink-500">{schoolName}</span>
        </p>
      </div>

      <div className="card p-4">
        <h2 className="text-sm font-semibold text-ink-900 mb-3">Change passcode</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Current passcode</label>
            <input className="input" type="password" value={currentPasscode} onChange={(e) => setCurrentPasscode(e.target.value)} />
          </div>
          <div>
            <label className="label">New passcode</label>
            <input className="input" type="password" value={newPasscode} onChange={(e) => setNewPasscode(e.target.value)} />
          </div>
          <div>
            <label className="label">Confirm new passcode</label>
            <input className="input" type="password" value={confirmPasscode} onChange={(e) => setConfirmPasscode(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}
          <button className="btn-primary" type="submit">
            Update passcode
          </button>
        </form>
      </div>

      <div className="card p-4 mt-4">
        <h2 className="text-sm font-semibold text-ink-900 mb-1">Data &amp; backups</h2>
        <p className="text-sm text-ink-500 mb-3">
          Download everything — pupils, markbook, CPD, pastoral notes, contacts, the lot — as one Excel
          file with a sheet per section. Worth doing every so often for your own peace of mind.
        </p>
        <a className="btn-primary" href="/api/exports/backup.xlsx">
          Download full backup (.xlsx)
        </a>
      </div>

      <div className="card p-4 mt-4">
        <h2 className="text-sm font-semibold text-ink-900 mb-1">Recycle bin</h2>
        <p className="text-sm text-ink-500 mb-3">
          Deleted a pupil, class, contact or other record by mistake? It's kept here for 30 days before
          being permanently removed.
        </p>
        <Link to="/settings/recycle-bin" className="btn-secondary">
          View recycle bin
        </Link>
      </div>

      <DemoDataCard />
    </div>
  );
}

function DemoDataCard() {
  const [loading, setLoading] = useState(false);
  const [wipeOpen, setWipeOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [wiping, setWiping] = useState(false);
  const [wipeError, setWipeError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function loadDemo() {
    if (!confirm("Add a set of fake pupils, classes, markbook entries etc. so someone can try the app without seeing real data?")) return;
    setLoading(true);
    setInfo(null);
    try {
      const res = await api.post<{ pupilsCreated: number }>("/demo/load-sample-data");
      setInfo(`Demo data added — ${res.pupilsCreated} fake pupils across two classes, a team, markbook, and more.`);
    } finally {
      setLoading(false);
    }
  }

  async function wipeAll() {
    setWiping(true);
    setWipeError(null);
    try {
      await api.post("/demo/wipe-all-data", { confirm: confirmText });
      setWipeOpen(false);
      setConfirmText("");
      setInfo("Everything has been wiped. The app is back to a blank slate — your passcode still works.");
    } catch (err: any) {
      setWipeError(err.message);
    } finally {
      setWiping(false);
    }
  }

  return (
    <div className="card p-4 mt-4">
      <h2 className="text-sm font-semibold text-ink-900 mb-1">Trial with a friend</h2>
      <p className="text-sm text-ink-500 mb-3">
        Load a set of fake pupils, classes and records so someone else can click around and give you feedback
        without seeing any real pupil data. Wipe it all afterwards before you add your real classes.
      </p>
      <div className="flex flex-wrap gap-2">
        <button className="btn-secondary" onClick={loadDemo} disabled={loading}>
          {loading ? "Adding…" : "Load demo data"}
        </button>
        <button className="btn-danger" onClick={() => setWipeOpen(true)}>
          Wipe all data
        </button>
      </div>
      {info && <p className="text-sm text-green-700 mt-2">{info}</p>}

      {wipeOpen && (
        <Modal title="Wipe all data" onClose={() => setWipeOpen(false)}>
          <div className="space-y-3">
            <p className="text-sm text-ink-700">
              This permanently deletes <strong>everything</strong> — every pupil, class, markbook entry,
              pastoral note, contact, all of it. Your passcode and login are not affected. This cannot be
              undone (it doesn't go to the recycle bin).
            </p>
            <div>
              <label className="label">Type DELETE EVERYTHING to confirm</label>
              <input className="input" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
            </div>
            {wipeError && <p className="text-sm text-red-600">{wipeError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button className="btn-secondary" onClick={() => setWipeOpen(false)}>
                Cancel
              </button>
              <button className="btn-danger" disabled={confirmText !== "DELETE EVERYTHING" || wiping} onClick={wipeAll}>
                {wiping ? "Wiping…" : "Permanently wipe everything"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
