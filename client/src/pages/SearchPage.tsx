import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { formatDate } from "../lib/dates";

export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    if (q) api.get(`/search?q=${encodeURIComponent(q)}`).then(setResults);
  }, [q]);

  if (!results) return <p className="text-sm text-ink-400">Searching…</p>;

  const sections = [
    { key: "notes", label: "Notes", items: results.notes, render: (n: any) => n.title || n.content.slice(0, 60) },
    {
      key: "reflections",
      label: "Lesson reflections",
      items: results.reflections,
      render: (r: any) => `${r.class?.name ?? ""} · ${r.whatWorked ?? r.whatDidnt ?? r.nextSteps ?? ""}`,
    },
    {
      key: "pastoralNotes",
      label: "Pastoral notes",
      items: results.pastoralNotes,
      render: (p: any) => `${p.pupil.firstName} ${p.pupil.lastName} · ${p.note.slice(0, 60)}`,
    },
    {
      key: "commsLog",
      label: "Parent communications",
      items: results.commsLog,
      render: (c: any) => `${c.pupil.firstName} ${c.pupil.lastName} · ${c.summary.slice(0, 60)}`,
    },
    { key: "cpdEntries", label: "CPD log", items: results.cpdEntries, render: (c: any) => c.title },
  ];

  const total = sections.reduce((n, s) => n + s.items.length, 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900 mb-1">Search results for "{q}"</h1>
      <p className="text-sm text-ink-500 mb-4">{total} result{total === 1 ? "" : "s"}</p>

      <div className="space-y-5">
        {sections.map((s) =>
          s.items.length === 0 ? null : (
            <div key={s.key}>
              <h2 className="text-sm font-semibold text-ink-700 mb-2">{s.label}</h2>
              <ul className="card divide-y divide-ink-50">
                {s.items.map((item: any) => (
                  <li key={item.id} className="p-3 flex items-center justify-between text-sm">
                    <span className="text-ink-800">{s.render(item)}</span>
                    <span className="text-xs text-ink-400">{formatDate(item.date)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        )}
        {total === 0 && <p className="text-sm text-ink-400">No matches found.</p>}
      </div>
    </div>
  );
}
