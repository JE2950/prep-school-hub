import { FormEvent, useState } from "react";
import { toInputDate } from "../lib/dates";

export type FieldType = "text" | "textarea" | "date" | "number" | "select" | "checkbox" | "time";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  span?: 1 | 2; // grid column span out of 2
}

function toFormValue(type: FieldType, value: unknown) {
  if (type === "date") return toInputDate(value as string);
  if (value === null || value === undefined) return type === "checkbox" ? false : "";
  return value;
}

export function ResourceForm({
  fields,
  initial,
  onCancel,
  onSubmit,
  submitLabel = "Save",
}: {
  fields: FieldDef[];
  initial?: any;
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const v: Record<string, unknown> = {};
    for (const f of fields) v[f.key] = toFormValue(f.type, initial?.[f.key]);
    return v;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(key: string, val: unknown) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {};
      for (const f of fields) {
        let val = values[f.key];
        if (f.type === "number") val = val === "" ? null : Number(val);
        if (f.type === "date") val = val === "" ? null : new Date(val as string).toISOString();
        payload[f.key] = val;
      }
      await onSubmit(payload);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {fields.map((f) => (
          <div key={f.key} className={f.span === 1 ? "col-span-1" : "col-span-2"}>
            {f.type !== "checkbox" && <label className="label">{f.label}</label>}
            {f.type === "textarea" && (
              <textarea
                className="input min-h-[80px]"
                value={(values[f.key] as string) ?? ""}
                placeholder={f.placeholder}
                required={f.required}
                onChange={(e) => setField(f.key, e.target.value)}
              />
            )}
            {f.type === "select" && (
              <select
                className="input"
                value={(values[f.key] as string) ?? ""}
                required={f.required}
                onChange={(e) => setField(f.key, e.target.value)}
              >
                <option value="">Select…</option>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
            {f.type === "checkbox" && (
              <label className="flex items-center gap-2 text-sm text-ink-700 mt-5">
                <input
                  type="checkbox"
                  checked={!!values[f.key]}
                  onChange={(e) => setField(f.key, e.target.checked)}
                />
                {f.label}
              </label>
            )}
            {(f.type === "text" || f.type === "date" || f.type === "number" || f.type === "time") && (
              <input
                className="input"
                type={f.type === "time" ? "time" : f.type}
                value={(values[f.key] as string) ?? ""}
                placeholder={f.placeholder}
                required={f.required}
                onChange={(e) => setField(f.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
