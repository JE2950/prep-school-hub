import { useState } from "react";
import { api } from "../lib/api";

export function AiPromptButton({
  label,
  endpoint,
  body,
}: {
  label: string;
  endpoint: string;
  body: Record<string, unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setOpen(true);
    setLoading(true);
    setCopied(false);
    try {
      const res = await api.post<{ prompt: string }>(endpoint, body);
      setPrompt(res.prompt);
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <button className="btn-secondary text-brand-700 border-brand-200" onClick={generate}>
        ✨ {label}
      </button>
      {open && (
        <div className="mt-3 rounded-lg border border-brand-200 bg-brand-50/50 p-3">
          {loading ? (
            <p className="text-sm text-ink-500">Building your prompt…</p>
          ) : (
            <>
              <textarea
                readOnly
                className="input min-h-[160px] bg-white font-mono text-xs leading-relaxed"
                value={prompt}
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button className="btn-primary" onClick={copy}>
                  {copied ? "Copied!" : "Copy prompt"}
                </button>
                <a
                  className="btn-secondary"
                  href="https://claude.ai/new"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Claude ↗
                </a>
                <a
                  className="btn-secondary"
                  href="https://chatgpt.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open ChatGPT ↗
                </a>
                <button className="btn-ghost ml-auto" onClick={() => setOpen(false)}>
                  Close
                </button>
              </div>
              <p className="mt-2 text-xs text-ink-400">
                Copy this, then paste it into Claude or ChatGPT to get a draft you can edit.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
