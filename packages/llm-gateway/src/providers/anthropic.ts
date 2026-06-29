import type { LLMPort } from '@cpe/core';

/** Anthropic messages adapter (LLMPort). */
export interface AnthropicProviderOptions {
  apiKey: string;
  apiBase?: string;
  version?: string;
}

interface MessagesResponse {
  content: Array<{ type: string; text?: string }>;
  usage?: { input_tokens: number; output_tokens: number };
}

export class AnthropicProvider implements LLMPort {
  private readonly apiKey: string;
  private readonly apiBase: string;
  private readonly version: string;

  constructor(opts: AnthropicProviderOptions) {
    this.apiKey = opts.apiKey;
    this.apiBase = opts.apiBase ?? 'https://api.anthropic.com/v1';
    this.version = opts.version ?? '2023-06-01';
  }

  async complete(input: {
    model: string;
    system?: string;
    prompt: string;
    maxTokens?: number;
  }): Promise<{ text: string; usage?: { inputTokens: number; outputTokens: number } }> {
    const res = await fetch(`${this.apiBase}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': this.version,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: input.model,
        max_tokens: input.maxTokens ?? 1024,
        ...(input.system ? { system: input.system } : {}),
        messages: [{ role: 'user', content: input.prompt }],
      }),
    });
    if (!res.ok) throw new Error(`anthropic completion failed: ${res.status} ${res.statusText}`);
    const json = (await res.json()) as MessagesResponse;
    const text = json.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text ?? '')
      .join('');
    return {
      text,
      usage: json.usage
        ? { inputTokens: json.usage.input_tokens, outputTokens: json.usage.output_tokens }
        : undefined,
    };
  }
}
