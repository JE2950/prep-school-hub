import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatDate } from "../lib/dates";
import { Modal } from "../components/Modal";
import { FieldDef, ResourceForm } from "../components/ResourceForm";

export function MarkbookPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [pupils, setPupils] = useState<any[]>([]);
  const [candidateModal, setCandidateModal] = useState(false);
  const [resultModal, setResultModal] = useState<{ candidateId: string } | null>(null);

  async function load() {
    const [c, cand, p] = await Promise.all([
      api.get<any[]>("/classes"),
      api.get<any[]>("/ce-candidates"),
      api.get<any[]>("/pupils"),
    ]);
    setClasses(c);
    setCandidates(cand);
    setPupils(p);
  }

  useEffect(() => {
    load();
  }, []);

  const candidateFields: FieldDef[] = [
    {
      key: "pupilId",
      label: "Pupil",
      type: "select",
      required: true,
      options: pupils
        .filter((p) => !candidates.some((c) => c.pupilId === p.id))
        .map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName}` })),
    },
    {
      key: "examBoard",
      label: "Exam board / type",
      type: "select",
      options: [
        { value: "ISEB CE", label: "ISEB Common Entrance" },
        { value: "Scholarship", label: "Scholarship" },
        { value: "Other", label: "Other" },
      ],
    },
    { key: "targetSchool", label: "Target school", type: "text" },
    { key: "notes", label: "Notes", type: "textarea", span: 2 },
  ];

  const resultFields: FieldDef[] = [
    { key: "subject", label: "Subject", type: "text", required: true },
    { key: "paper", label: "Paper", type: "text" },
    { key: "date", label: "Date", type: "date", required: true },
    { key: "score", label: "Score", type: "number" },
    { key: "maxScore", label: "Max score", type: "number", required: true },
    { key: "notes", label: "Notes", type: "textarea", span: 2 },
  ];

  async function addCandidate(values: Record<string, unknown>) {
    await api.post("/ce-candidates", values);
    setCandidateModal(false);
    load();
  }

  async function addResult(values: Record<string, unknown>) {
    if (!resultModal) return;
    await api.post("/ce-results", { ...values, candidateId: resultModal.candidateId });
    setResultModal(null);
    load();
  }

  async function removeCandidate(id: string) {
    if (!confirm("Remove this candidate and all their practice results?")) return;
    await api.del(`/ce-candidates/${id}`);
    load();
  }

  async function removeResult(id: string) {
    if (!confirm("Delete this result?")) return;
    await api.del(`/ce-results/${id}`);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900 mb-1">Markbook</h1>
        <p className="text-sm text-ink-500 mb-3">Open a class to enter test, prep and vocab scores.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {classes.map((c) => (
            <Link key={c.id} to={`/classes/${c.id}`} className="card p-4 hover:border-brand-300">
              <h3 className="font-semibold text-ink-900">{c.name}</h3>
              <p className="text-sm text-ink-500">{c.subject}</p>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Common Entrance & Scholarship tracker</h2>
            <p className="text-sm text-ink-500">Paper-by-paper practice results over time.</p>
          </div>
          <button className="btn-primary" onClick={() => setCandidateModal(true)}>
            + Add candidate
          </button>
        </div>

        <div className="space-y-4">
          {candidates.map((c) => (
            <div key={c.id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-ink-900">
                    {c.pupil.firstName} {c.pupil.lastName}
                  </h3>
                  <p className="text-xs text-ink-500">
                    {c.examBoard ?? "—"} {c.targetSchool ? `· Target: ${c.targetSchool}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-secondary" onClick={() => setResultModal({ candidateId: c.id })}>
                    + Add result
                  </button>
                  <button className="text-xs text-ink-400 hover:text-red-600" onClick={() => removeCandidate(c.id)}>
                    Remove
                  </button>
                </div>
              </div>
              {c.results.length === 0 ? (
                <p className="text-sm text-ink-400">No practice results logged yet.</p>
              ) : (
                <table className="w-full text-sm mt-2">
                  <thead>
                    <tr className="text-left text-ink-500 border-b border-ink-100">
                      <th className="py-1.5 font-medium">Subject</th>
                      <th className="py-1.5 font-medium">Paper</th>
                      <th className="py-1.5 font-medium">Date</th>
                      <th className="py-1.5 font-medium">Score</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.results
                      .slice()
                      .sort((a: any, b: any) => (a.date < b.date ? 1 : -1))
                      .map((r: any) => (
                        <tr key={r.id} className="border-b border-ink-50">
                          <td className="py-1.5">{r.subject}</td>
                          <td className="py-1.5">{r.paper ?? "—"}</td>
                          <td className="py-1.5">{formatDate(r.date)}</td>
                          <td className="py-1.5">
                            {r.score !== null ? `${r.score}/${r.maxScore} (${Math.round((r.score / r.maxScore) * 100)}%)` : "—"}
                          </td>
                          <td className="py-1.5 text-right">
                            <button className="text-xs text-ink-400 hover:text-red-600" onClick={() => removeResult(r.id)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
          {candidates.length === 0 && <p className="text-sm text-ink-400">No CE/scholarship candidates added yet.</p>}
        </div>
      </div>

      {candidateModal && (
        <Modal title="Add CE/scholarship candidate" onClose={() => setCandidateModal(false)}>
          <ResourceForm fields={candidateFields} onCancel={() => setCandidateModal(false)} onSubmit={addCandidate} />
        </Modal>
      )}

      {resultModal && (
        <Modal title="Add practice result" onClose={() => setResultModal(null)}>
          <ResourceForm fields={resultFields} onCancel={() => setResultModal(null)} onSubmit={addResult} />
        </Modal>
      )}
    </div>
  );
}
