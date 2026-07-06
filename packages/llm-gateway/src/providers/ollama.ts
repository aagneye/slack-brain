import type { LLMPort } from '@cpe/core';

/**
 * Ollama chat adapter — uses the OpenAI-compatible API at /v1/chat/completions.
 * No API key required; runs locally or on a private host.
 */
export interface OllamaProviderOptions {
  /** Base URL without trailing slash, e.g. http://localhost:11434 */
  baseUrl?: string;
  /** Default model when request uses model id "ollama" */
  defaultModel?: string;
}

interface ChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
  message?: { content?: string };
}

export class OllamaProvider implements LLMPort {
  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor(opts: OllamaProviderOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(
      /\/$/,
      '',
    );
    this.defaultModel = opts.defaultModel ?? process.env.OLLAMA_MODEL ?? 'llama3.2';
  }

  resolveModel(requested: string): string {
    if (requested === 'ollama' || requested === 'ollama:default') return this.defaultModel;
    if (requested.startsWith('ollama:')) return requested.slice('ollama:'.length);
    return requested;
  }

  async complete(input: {
    model: string;
    system?: string;
    prompt: string;
    maxTokens?: number;
  }): Promise<{ text: string; usage?: { inputTokens: number; outputTokens: number } }> {
    const model = this.resolveModel(input.model);
    const messages = [
      ...(input.system ? [{ role: 'system' as const, content: input.system }] : []),
      { role: 'user' as const, content: input.prompt },
    ];

    const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: { num_predict: input.maxTokens ?? 1024 },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`ollama completion failed: ${res.status} ${detail}`.trim());
    }

    const json = (await res.json()) as ChatResponse;
    const text =
      json.choices?.[0]?.message?.content?.trim() ??
      json.message?.content?.trim() ??
      '';

    return { text };
  }

  async health(): Promise<{ ok: boolean; detail?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };
      return { ok: true };
    } catch (e) {
      return { ok: false, detail: (e as Error).message };
    }
  }
}
