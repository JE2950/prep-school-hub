import { FormEvent, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

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
    </div>
  );
}
