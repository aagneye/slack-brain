import type { LLMPort } from '@cpe/core';

/** Ollama /api/chat adapter (LLMPort) for local or self-hosted models. */
export interface OllamaProviderOptions {
  baseUrl?: string;
  defaultModel?: string;
}

interface ChatResponse {
  message?: { content?: string };
  eval_count?: number;
  prompt_eval_count?: number;
}

export class OllamaProvider implements LLMPort {
  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor(opts: OllamaProviderOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(
      /\/$/,
      '',
    );
    this.defaultModel = opts.defaultModel ?? process.env.OLLAMA_CHAT_MODEL ?? 'llama3.2';
  }

  /** Maps gateway model ids (`ollama`, `ollama:llama3.2`) to an Ollama model name. */
  resolveModel(model: string): string {
    if (model === 'ollama') return this.defaultModel;
    if (model.startsWith('ollama:')) return model.slice('ollama:'.length);
    return model;
  }

  async complete(input: {
    model: string;
    system?: string;
    prompt: string;
    maxTokens?: number;
  }): Promise<{ text: string; usage?: { inputTokens: number; outputTokens: number } }> {
    const model = this.resolveModel(input.model);
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          ...(input.system ? [{ role: 'system', content: input.system }] : []),
          { role: 'user', content: input.prompt },
        ],
        options: { num_predict: input.maxTokens ?? 1024 },
      }),
    });
    if (!res.ok) throw new Error(`ollama completion failed: ${res.status} ${res.statusText}`);
    const json = (await res.json()) as ChatResponse;
    const text = json.message?.content ?? '';
    return {
      text,
      usage:
        json.prompt_eval_count != null && json.eval_count != null
          ? { inputTokens: json.prompt_eval_count, outputTokens: json.eval_count }
          : undefined,
    };
  }
}
