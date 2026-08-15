import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatDate } from "../lib/dates";

interface RecycleEntry {
  model: string;
  category: string;
  label: string;
  id: string;
  deletedAt: string;
}

export function RecycleBinPage() {
  const [entries, setEntries] = useState<RecycleEntry[] | null>(null);
  const [retentionDays, setRetentionDays] = useState(30);

  async function load() {
    const data = await api.get<{ entries: RecycleEntry[]; retentionDays: number }>("/recycle-bin");
    setEntries(data.entries);
    setRetentionDays(data.retentionDays);
  }

  useEffect(() => {
    load();
  }, []);

  async function restore(entry: RecycleEntry) {
    await api.post(`/recycle-bin/${entry.model}/${entry.id}/restore`);
    load();
  }

  async function destroyForever(entry: RecycleEntry) {
    if (!confirm(`Permanently delete "${entry.label}"? This cannot be undone.`)) return;
    await api.del(`/recycle-bin/${entry.model}/${entry.id}`);
    load();
  }

  return (
    <div>
      <Link to="/settings" className="text-xs text-ink-400 hover:text-brand-700">
        ← Settings
      </Link>
      <h1 className="text-2xl font-semibold text-ink-900 mt-1 mb-1">Recycle bin</h1>
      <p className="text-sm text-ink-500 mb-4">
        Deleted pupils, classes, contacts and other records stay here for {retentionDays} days before being
        permanently removed.
      </p>

      {!entries ? (
        <p className="text-sm text-ink-400">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-ink-400">Nothing in the recycle bin.</p>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-ink-50">
            {entries.map((e) => (
              <li key={`${e.model}-${e.id}`} className="p-3 flex items-center gap-3">
                <span className="badge bg-ink-100 text-ink-600 shrink-0">{e.category}</span>
                <span className="text-sm text-ink-800 flex-1 truncate">{e.label || "(untitled)"}</span>
                <span className="text-xs text-ink-400 shrink-0">Deleted {formatDate(e.deletedAt)}</span>
                <button className="btn-secondary shrink-0" onClick={() => restore(e)}>
                  Restore
                </button>
                <button className="text-xs text-ink-400 hover:text-red-600 shrink-0" onClick={() => destroyForever(e)}>
                  Delete forever
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
