import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { formatDate } from "../../lib/dates";
import { Modal } from "../../components/Modal";
import { FieldDef, ResourceForm } from "../../components/ResourceForm";
import { AiPromptButton } from "../../components/AiPromptPanel";

type Tab = "roster" | "sow" | "reflections" | "markbook" | "cover";

const SOW_STATUS_COLOUR: Record<string, string> = {
  planned: "bg-ink-100 text-ink-600",
  taught: "bg-category-academic/15 text-category-academic",
  assessed: "bg-category-sport/15 text-category-sport",
  revisited: "bg-category-pastoral/15 text-category-pastoral",
};

export function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const [cls, setCls] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("roster");
  const [editingClass, setEditingClass] = useState(false);

  async function load() {
    setCls(await api.get(`/classes/${classId}`));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  if (!cls) return <p className="text-sm text-ink-400">Loading…</p>;

  const classFields: FieldDef[] = [
    { key: "name", label: "Class / set name", type: "text", required: true },
    { key: "subject", label: "Subject", type: "text", required: true },
    { key: "yearGroup", label: "Year group", type: "text" },
    { key: "currentTopic", label: "Current topic", type: "text", span: 2 },
    { key: "notes", label: "Notes", type: "textarea", span: 2 },
  ];

  async function saveClass(values: Record<string, unknown>) {
    await api.put(`/classes/${classId}`, values);
    setEditingClass(false);
    load();
  }

  return (
    <div>
      <Link to="/classes" className="text-xs text-ink-400 hover:text-brand-700">
        ← All classes
      </Link>
      <div className="flex items-start justify-between mt-1 mb-4">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">
            {cls.name} <span className="text-ink-400 font-normal">· {cls.subject}</span>
          </h1>
          <p className="text-sm text-ink-500 mt-0.5">
            {cls.currentTopic ? `Current topic: ${cls.currentTopic}` : "No current topic set"}
          </p>
        </div>
        <button className="btn-secondary" onClick={() => setEditingClass(true)}>
          Edit class
        </button>
      </div>

      <div className="flex gap-1 border-b border-ink-200 mb-4 overflow-x-auto">
        {(
          [
            ["roster", "Roster"],
            ["sow", "Scheme of work"],
            ["reflections", "Reflections"],
            ["markbook", "Markbook"],
            ["cover", "Cover folder"],
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

      {tab === "roster" && <RosterTab cls={cls} onChange={load} />}
      {tab === "sow" && <SowTab classId={classId!} sowTopics={cls.sowTopics} onChange={load} />}
      {tab === "reflections" && <ReflectionsTab classId={classId!} sowTopics={cls.sowTopics} className={cls.name} />}
      {tab === "markbook" && <MarkbookTab classId={classId!} />}
      {tab === "cover" && <CoverTab cls={cls} onChange={load} />}

      {editingClass && (
        <Modal title="Edit class" onClose={() => setEditingClass(false)}>
          <ResourceForm fields={classFields} initial={cls} onCancel={() => setEditingClass(false)} onSubmit={saveClass} />
        </Modal>
      )}
    </div>
  );
}

// ---------- Roster ----------

function RosterTab({ cls, onChange }: { cls: any; onChange: () => void }) {
  const [allPupils, setAllPupils] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [selectedPupil, setSelectedPupil] = useState("");

  useEffect(() => {
    api.get<any[]>("/pupils").then(setAllPupils);
  }, []);

  const rosterIds = new Set(cls.pupils.map((cp: any) => cp.pupilId));
  const available = allPupils.filter((p) => !rosterIds.has(p.id));

  async function addPupil() {
    if (!selectedPupil) return;
    await api.post("/class-pupils", { classId: cls.id, pupilId: selectedPupil });
    setSelectedPupil("");
    setAdding(false);
    onChange();
  }

  async function removePupil(classPupilId: string) {
    await api.del(`/class-pupils/${classPupilId}`);
    onChange();
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-ink-900">Pupil list ({cls.pupils.length})</h2>
        <button className="btn-secondary" onClick={() => setAdding(true)}>
          + Add pupil
        </button>
      </div>
      {cls.pupils.length === 0 ? (
        <p className="text-sm text-ink-400">No pupils on this roster yet.</p>
      ) : (
        <ul className="divide-y divide-ink-50">
          {cls.pupils.map((cp: any) => (
            <li key={cp.id} className="py-2 flex items-center justify-between">
              <Link to={`/pupils`} className="text-sm text-ink-800 hover:text-brand-700">
                {cp.pupil.firstName} {cp.pupil.lastName}
              </Link>
              <button className="text-xs text-ink-400 hover:text-red-600" onClick={() => removePupil(cp.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <Modal title="Add pupil to class" onClose={() => setAdding(false)}>
          <div className="space-y-3">
            {available.length === 0 ? (
              <p className="text-sm text-ink-500">
                All pupils are already on this roster, or you haven't added any pupils yet.{" "}
                <Link to="/pupils" className="text-brand-700 hover:underline">
                  Manage pupils
                </Link>
                .
              </p>
            ) : (
              <>
                <select className="input" value={selectedPupil} onChange={(e) => setSelectedPupil(e.target.value)}>
                  <option value="">Select a pupil…</option>
                  {available.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end gap-2">
                  <button className="btn-secondary" onClick={() => setAdding(false)}>
                    Cancel
                  </button>
                  <button className="btn-primary" onClick={addPupil} disabled={!selectedPupil}>
                    Add
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---------- Scheme of work ----------

function SowTab({ classId, sowTopics, onChange }: { classId: string; sowTopics: any[]; onChange: () => void }) {
  const [modal, setModal] = useState<{ editing: any | null } | null>(null);

  const fields: FieldDef[] = [
    { key: "title", label: "Topic", type: "text", required: true, span: 2 },
    { key: "order", label: "Order", type: "number" },
    {
      key: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { value: "planned", label: "Planned" },
        { value: "taught", label: "Taught" },
        { value: "assessed", label: "Assessed" },
        { value: "revisited", label: "Revisited" },
      ],
    },
    { key: "notes", label: "Notes", type: "textarea", span: 2 },
  ];

  async function handleSubmit(values: Record<string, unknown>) {
    const payload = { ...values, classId, order: values.order ?? sowTopics.length };
    if (modal?.editing) {
      await api.put(`/sow-topics/${modal.editing.id}`, payload);
    } else {
      await api.post("/sow-topics", payload);
    }
    setModal(null);
    onChange();
  }

  async function quickSetStatus(topic: any, status: string) {
    await api.put(`/sow-topics/${topic.id}`, { status });
    onChange();
  }

  async function remove(id: string) {
    if (!confirm("Remove this topic?")) return;
    await api.del(`/sow-topics/${id}`);
    onChange();
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-ink-900">Scheme of work</h2>
        <div className="flex items-center gap-2">
          <AiPromptButton label="Suggest next steps" endpoint="/ai-prompts/sow-next-steps" body={{ classId }} />
          <button className="btn-primary" onClick={() => setModal({ editing: null })}>
            + Add topic
          </button>
        </div>
      </div>
      {sowTopics.length === 0 ? (
        <p className="text-sm text-ink-400">No topics listed yet.</p>
      ) : (
        <ol className="space-y-2">
          {sowTopics
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-lg border border-ink-100 p-2.5">
                <span className="text-sm text-ink-800 flex-1">{t.title}</span>
                <select
                  className={`text-xs rounded-full px-2 py-1 border-0 ${SOW_STATUS_COLOUR[t.status] ?? ""}`}
                  value={t.status}
                  onChange={(e) => quickSetStatus(t, e.target.value)}
                >
                  <option value="planned">Planned</option>
                  <option value="taught">Taught</option>
                  <option value="assessed">Assessed</option>
                  <option value="revisited">Revisited</option>
                </select>
                <button className="text-xs text-ink-400 hover:text-brand-700" onClick={() => setModal({ editing: t })}>
                  Edit
                </button>
                <button className="text-xs text-ink-400 hover:text-red-600" onClick={() => remove(t.id)}>
                  Delete
                </button>
              </li>
            ))}
        </ol>
      )}

      {modal && (
        <Modal title={modal.editing ? "Edit topic" : "Add topic"} onClose={() => setModal(null)}>
          <ResourceForm fields={fields} initial={modal.editing ?? undefined} onCancel={() => setModal(null)} onSubmit={handleSubmit} />
        </Modal>
      )}
    </div>
  );
}

// ---------- Reflections ----------

function ReflectionsTab({ classId, sowTopics, className }: { classId: string; sowTopics: any[]; className: string }) {
  const [reflections, setReflections] = useState<any[]>([]);
  const [modal, setModal] = useState(false);

  async function load() {
    setReflections(await api.get(`/lesson-reflections?classId=${classId}`));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const fields: FieldDef[] = [
    { key: "date", label: "Date", type: "date", required: true },
    { key: "topicId", label: "Topic (optional)", type: "select", options: sowTopics.map((t) => ({ value: t.id, label: t.title })) },
    { key: "whatWorked", label: "What worked", type: "textarea", span: 2 },
    { key: "whatDidnt", label: "What didn't work", type: "textarea", span: 2 },
    { key: "nextSteps", label: "Next steps", type: "textarea", span: 2 },
    { key: "tags", label: "Tags (comma-separated)", type: "text", span: 2 },
  ];

  async function handleSubmit(values: Record<string, unknown>) {
    await api.post("/lesson-reflections", { ...values, classId });
    setModal(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this reflection?")) return;
    await api.del(`/lesson-reflections/${id}`);
    load();
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-ink-900">Lesson reflections</h2>
        <div className="flex items-center gap-2">
          <AiPromptButton
            label="Summarise for end of term"
            endpoint="/ai-prompts/reflection-summary"
            body={{ classId }}
          />
          <button className="btn-primary" onClick={() => setModal(true)}>
            + Add reflection
          </button>
        </div>
      </div>
      {reflections.length === 0 ? (
        <p className="text-sm text-ink-400">No reflections logged for {className} yet.</p>
      ) : (
        <ul className="space-y-3">
          {reflections.map((r) => (
            <li key={r.id} className="rounded-lg border border-ink-100 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-ink-400">{formatDate(r.date)}{r.topic ? ` · ${r.topic.title}` : ""}</span>
                <button className="text-xs text-ink-400 hover:text-red-600" onClick={() => remove(r.id)}>
                  Delete
                </button>
              </div>
              {r.whatWorked && <p className="text-sm text-ink-800"><span className="font-medium">Worked:</span> {r.whatWorked}</p>}
              {r.whatDidnt && <p className="text-sm text-ink-800"><span className="font-medium">Didn't work:</span> {r.whatDidnt}</p>}
              {r.nextSteps && <p className="text-sm text-ink-800"><span className="font-medium">Next steps:</span> {r.nextSteps}</p>}
              {r.tags && <p className="text-xs text-ink-400 mt-1">Tags: {r.tags}</p>}
            </li>
          ))}
        </ul>
      )}

      {modal && (
        <Modal title="Add lesson reflection" onClose={() => setModal(false)}>
          <ResourceForm fields={fields} onCancel={() => setModal(false)} onSubmit={handleSubmit} />
        </Modal>
      )}
    </div>
  );
}

// ---------- Markbook ----------

function MarkbookTab({ classId }: { classId: string }) {
  const [data, setData] = useState<any>(null);
  const [modal, setModal] = useState(false);

  async function load() {
    setData(await api.get(`/markbook/${classId}`));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const assessmentFields: FieldDef[] = [
    { key: "title", label: "Title", type: "text", required: true },
    {
      key: "type",
      label: "Type",
      type: "select",
      required: true,
      options: [
        { value: "test", label: "Test" },
        { value: "prep", label: "Prep" },
        { value: "vocab", label: "Vocab quiz" },
      ],
    },
    { key: "date", label: "Date", type: "date", required: true },
    { key: "maxScore", label: "Max score", type: "number", required: true },
  ];

  async function addAssessment(values: Record<string, unknown>) {
    await api.post("/mark-assessments", { ...values, classId });
    setModal(false);
    load();
  }

  async function setScore(assessmentId: string, pupilId: string, score: string) {
    await api.put("/markbook/score", { assessmentId, pupilId, score: score === "" ? null : Number(score) });
    load();
  }

  if (!data) return <p className="text-sm text-ink-400">Loading…</p>;

  const flagColour: Record<string, string> = {
    green: "bg-green-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    none: "bg-ink-200",
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-ink-900">Markbook</h2>
        <div className="flex items-center gap-2">
          <a className="btn-secondary" href={`/api/markbook/${classId}/export.csv`} target="_blank" rel="noreferrer">
            Export CSV
          </a>
          <button className="btn-primary" onClick={() => setModal(true)}>
            + New assessment
          </button>
        </div>
      </div>

      {data.assessments.length === 0 ? (
        <p className="text-sm text-ink-400">No assessments recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="text-sm min-w-full">
            <thead>
              <tr className="border-b border-ink-100 text-left text-ink-500">
                <th className="py-2 pr-4 font-medium">Pupil</th>
                {data.assessments.map((a: any) => (
                  <th key={a.id} className="py-2 px-2 font-medium whitespace-nowrap">
                    {a.title}
                    <br />
                    <span className="text-[10px] text-ink-400 font-normal">/{a.maxScore}</span>
                  </th>
                ))}
                <th className="py-2 px-2 font-medium">Average</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row: any) => (
                <tr key={row.pupilId} className="border-b border-ink-50">
                  <td className="py-2 pr-4 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${flagColour[row.flag]}`} />
                    {row.pupilName}
                  </td>
                  {row.scores.map((s: any) => (
                    <td key={s.assessmentId} className="py-1 px-2">
                      <input
                        type="number"
                        defaultValue={s.score ?? ""}
                        className="w-16 rounded border border-ink-200 px-1.5 py-1 text-xs"
                        onBlur={(e) => setScore(s.assessmentId, row.pupilId, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="py-2 px-2 text-ink-600">
                    {row.averagePct !== null ? `${Math.round(row.averagePct * 100)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title="New assessment" onClose={() => setModal(false)}>
          <ResourceForm fields={assessmentFields} onCancel={() => setModal(false)} onSubmit={addAssessment} />
        </Modal>
      )}
    </div>
  );
}

// ---------- Cover folder ----------

function CoverTab({ cls, onChange }: { cls: any; onChange: () => void }) {
  const [editing, setEditing] = useState(false);

  const fields: FieldDef[] = [
    { key: "standingCoverLesson", label: "Standing cover lesson", type: "textarea", span: 2 },
    { key: "seatingNotes", label: "Seating notes", type: "textarea", span: 2 },
    { key: "pupilNotes", label: "Pupil-specific notes", type: "textarea", span: 2 },
  ];

  async function save(values: Record<string, unknown>) {
    if (cls.coverFolder) {
      await api.put(`/cover-folders/${cls.coverFolder.id}`, values);
    } else {
      await api.post("/cover-folders", { ...values, classId: cls.id });
    }
    setEditing(false);
    onChange();
  }

  const folder = cls.coverFolder;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-ink-900">Cover folder</h2>
        <div className="flex items-center gap-2">
          <AiPromptButton label="Draft cover lesson" endpoint="/ai-prompts/cover-lesson" body={{ classId: cls.id }} />
          <button className="btn-secondary" onClick={() => setEditing(true)}>
            {folder ? "Edit" : "Set up"}
          </button>
        </div>
      </div>

      {!folder ? (
        <p className="text-sm text-ink-400">No cover folder set up yet — add one so a covering teacher has everything they need.</p>
      ) : (
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs font-medium text-ink-500">Standing cover lesson</p>
            <p className="text-ink-800 whitespace-pre-wrap">{folder.standingCoverLesson || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-500">Seating notes</p>
            <p className="text-ink-800 whitespace-pre-wrap">{folder.seatingNotes || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-500">Pupil-specific notes</p>
            <p className="text-ink-800 whitespace-pre-wrap">{folder.pupilNotes || "—"}</p>
          </div>
        </div>
      )}

      {editing && (
        <Modal title="Cover folder" onClose={() => setEditing(false)} wide>
          <ResourceForm fields={fields} initial={folder ?? undefined} onCancel={() => setEditing(false)} onSubmit={save} />
        </Modal>
      )}
    </div>
  );
}
