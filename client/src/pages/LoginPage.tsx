import { FormEvent, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

export function LoginPage() {
  const { setupDone, refresh } = useAuth();
  const [passcode, setPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSetup(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (passcode.length < 4) return setError("Passcode must be at least 4 characters.");
    if (passcode !== confirmPasscode) return setError("Passcodes don't match.");
    setBusy(true);
    try {
      await api.post("/auth/setup", { passcode, teacherName, schoolName });
      await refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post("/auth/login", { passcode });
      await refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-sm card p-6">
        <h1 className="text-2xl font-semibold text-ink-900 mb-1">
          {setupDone ? "Welcome back" : "Set up your Prep School Hub"}
        </h1>
        <p className="text-sm text-ink-500 mb-5">
          {setupDone
            ? "Enter your passcode to continue."
            : "This app is private to you. Choose a passcode to protect it — you'll use it every time you open the hub on this machine."}
        </p>

        {setupDone ? (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="label">Passcode</label>
              <input
                className="input"
                type="password"
                autoFocus
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="btn-primary w-full" disabled={busy}>
              {busy ? "Checking…" : "Log in"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSetup} className="space-y-3">
            <div>
              <label className="label">Your name</label>
              <input className="input" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} />
            </div>
            <div>
              <label className="label">School name</label>
              <input className="input" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
            </div>
            <div>
              <label className="label">Choose a passcode</label>
              <input
                className="input"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Confirm passcode</label>
              <input
                className="input"
                type="password"
                value={confirmPasscode}
                onChange={(e) => setConfirmPasscode(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="btn-primary w-full" disabled={busy}>
              {busy ? "Setting up…" : "Create my hub"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
