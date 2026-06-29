import type { LLMPort } from '@cpe/core';

/** OpenAI chat completions adapter (LLMPort). */
export interface OpenAIProviderOptions {
  apiKey: string;
  apiBase?: string;
}

interface ChatResponse {
  choices: Array<{ message: { content: string } }>;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

export class OpenAIProvider implements LLMPort {
  private readonly apiKey: string;
  private readonly apiBase: string;

  constructor(opts: OpenAIProviderOptions) {
    this.apiKey = opts.apiKey;
    this.apiBase = opts.apiBase ?? 'https://api.openai.com/v1';
  }

  async complete(input: {
    model: string;
    system?: string;
    prompt: string;
    maxTokens?: number;
  }): Promise<{ text: string; usage?: { inputTokens: number; outputTokens: number } }> {
    const res = await fetch(`${this.apiBase}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: input.model,
        max_tokens: input.maxTokens ?? 1024,
        messages: [
          ...(input.system ? [{ role: 'system', content: input.system }] : []),
          { role: 'user', content: input.prompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`openai completion failed: ${res.status} ${res.statusText}`);
    const json = (await res.json()) as ChatResponse;
    return {
      text: json.choices[0]?.message.content ?? '',
      usage: json.usage
        ? { inputTokens: json.usage.prompt_tokens, outputTokens: json.usage.completion_tokens }
        : undefined,
    };
  }
}
