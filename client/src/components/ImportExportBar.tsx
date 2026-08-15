import { useRef, useState } from "react";
import { api } from "../lib/api";
import { Modal } from "./Modal";

interface ImportSummary {
  created: number;
  updated: number;
  linked?: number;
  tutorGroupsCreated?: string[];
  errors: { row: number; message: string }[];
}

export function ImportExportBar({
  label,
  templateUrl,
  exportUrl,
  importUrl,
  onImported,
}: {
  label: string;
  templateUrl: string;
  exportUrl: string;
  importUrl: string;
  onImported: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await api.upload<ImportSummary>(importUrl, fd);
      setSummary(result);
      onImported();
    } catch (err: any) {
      setSummary({ created: 0, updated: 0, errors: [{ row: 0, message: err.message ?? "Upload failed." }] });
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-ink-400 mr-1">{label}:</span>
      <a className="btn-secondary" href={templateUrl}>
        Download template
      </a>
      <a className="btn-secondary" href={exportUrl}>
        Export current list
      </a>
      <button className="btn-secondary" disabled={uploading} onClick={() => fileInput.current?.click()}>
        {uploading ? "Uploading…" : "Import from Excel"}
      </button>
      <input ref={fileInput} type="file" accept=".xlsx" className="hidden" onChange={handleFile} />

      {summary && (
        <Modal title="Import results" onClose={() => setSummary(null)}>
          <div className="space-y-2 text-sm">
            <p className="text-ink-800">
              {summary.created} created, {summary.updated} updated
              {typeof summary.linked === "number" ? `, ${summary.linked} added to this class` : ""}.
            </p>
            {summary.tutorGroupsCreated && summary.tutorGroupsCreated.length > 0 && (
              <p className="text-ink-600">New tutor groups created: {summary.tutorGroupsCreated.join(", ")}</p>
            )}
            {summary.errors.length > 0 && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="font-medium text-red-800 mb-1">
                  {summary.errors.length} row{summary.errors.length === 1 ? "" : "s"} skipped:
                </p>
                <ul className="list-disc pl-4 text-red-700 space-y-0.5">
                  {summary.errors.map((e, i) => (
                    <li key={i}>{e.row ? `Row ${e.row}: ` : ""}{e.message}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button className="btn-primary" onClick={() => setSummary(null)}>
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
