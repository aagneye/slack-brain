import type { LLMPort } from '@cpe/core';
import type { ContextPack, LLMModel } from '@cpe/shared';
import { formatPackAsPrompt } from './format.js';

/**
 * LLM Gateway — model-agnostic routing.
 *
 * Picks the right provider for a requested model, formats the Context Pack into a
 * prompt, sends it, and returns the answer plus usage. Cursor is handled as a
 * deep-link handoff rather than a server-side completion.
 */

export interface GatewayProviders {
  ollama?: LLMPort;
  openai?: LLMPort;
  anthropic?: LLMPort;
}

export interface SendResult {
  kind: 'answer' | 'handoff';
  text?: string;
  handoffUrl?: string;
  usage?: { inputTokens: number; outputTokens: number };
  model: string;
}

function providerForModel(model: string, providers: GatewayProviders): LLMPort | null {
  if (model === 'ollama' || model.startsWith('ollama:')) return providers.ollama ?? null;
  if (model.startsWith('claude')) return providers.anthropic ?? null;
  if (model.startsWith('gpt')) return providers.openai ?? null;
  return null;
}

export class LLMGateway {
  constructor(
    private readonly providers: GatewayProviders,
    private readonly appBaseUrl: string,
  ) {}

  async send(pack: ContextPack, model: LLMModel): Promise<SendResult> {
    if (model === 'cursor') {
      return {
        kind: 'handoff',
        handoffUrl: `${this.appBaseUrl}/p/${pack.permalinkSlug}?handoff=cursor`,
        model,
      };
    }

    const provider = providerForModel(model, this.providers);
    if (!provider) throw new Error(`No provider configured for model "${model}"`);

    const { system, prompt } = formatPackAsPrompt(pack);
    const { text, usage } = await provider.complete({ model, system, prompt, maxTokens: 1500 });
    return { kind: 'answer', text, usage, model };
  }
}
