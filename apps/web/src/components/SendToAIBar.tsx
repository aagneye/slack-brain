'use client';

import { useState } from 'react';

export interface SendModelOption {
  id: string;
  label: string;
}

export function SendToAIBar({
  packId,
  models,
}: {
  packId: string;
  models: SendModelOption[];
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(model: string) {
    setBusy(model);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch(`/api/packs/${packId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model }),
      });
      if (!res.ok) throw new Error(`Send failed (${res.status})`);
      const data = (await res.json()) as { kind: string; text?: string; handoffUrl?: string };
      if (data.kind === 'handoff' && data.handoffUrl) {
        window.open(data.handoffUrl, '_blank');
      } else {
        setAnswer(data.text ?? '(no response)');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (models.length === 0) {
    return (
      <div className="card text-sm text-neutral-500">
        No LLM configured. Set OLLAMA_BASE_URL or a cloud API key in your environment.
      </div>
    );
  }

  return (
    <div className="card sticky bottom-4">
      <div className="flex flex-wrap gap-2">
        {models.map((m) => (
          <button
            key={m.id}
            onClick={() => send(m.id)}
            disabled={!!busy}
            className="btn-primary disabled:opacity-50"
          >
            {busy === m.id ? 'Sending…' : m.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      {answer && (
        <div className="mt-4 rounded-lg bg-neutral-100 p-4 text-sm dark:bg-neutral-800">
          <p className="mb-1 text-xs font-semibold uppercase text-neutral-500">AI answer</p>
          <p className="whitespace-pre-wrap">{answer}</p>
        </div>
      )}
    </div>
  );
}
