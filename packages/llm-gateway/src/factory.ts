import type { EmbeddingPort, LLMPort } from '@cpe/core';
import {
  HashingEmbeddings,
  OllamaEmbeddings,
  OpenAIEmbeddings,
} from './embeddings.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { OllamaProvider } from './providers/ollama.js';
import { OpenAIProvider } from './providers/openai.js';
import type { GatewayProviders } from './gateway.js';

export function isOllamaEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return !!(env.OLLAMA_BASE_URL ?? env.OLLAMA_MODEL);
}

/** Pick embeddings: ollama → openai → hashing fallback. */
export function createEmbeddings(env: NodeJS.ProcessEnv = process.env): EmbeddingPort {
  const provider = env.EMBEDDINGS_PROVIDER ?? (isOllamaEnabled(env) ? 'ollama' : 'openai');

  if (provider === 'ollama' || (provider === 'openai' && isOllamaEnabled(env) && !env.OPENAI_API_KEY)) {
    return new OllamaEmbeddings({
      baseUrl: env.OLLAMA_BASE_URL,
      model: env.OLLAMA_EMBED_MODEL,
    });
  }

  if (env.OPENAI_API_KEY) {
    return new OpenAIEmbeddings({ apiKey: env.OPENAI_API_KEY });
  }

  return new HashingEmbeddings();
}

/** Primary LLM for compression / pipeline (first match wins). */
export function createPipelineLLM(env: NodeJS.ProcessEnv = process.env): LLMPort | null {
  if (isOllamaEnabled(env)) return new OllamaProvider();
  if (env.OPENAI_API_KEY) return new OpenAIProvider({ apiKey: env.OPENAI_API_KEY });
  if (env.ANTHROPIC_API_KEY) return new AnthropicProvider({ apiKey: env.ANTHROPIC_API_KEY });
  return null;
}

/** Model name for compression when using Ollama. */
export function compressionModel(env: NodeJS.ProcessEnv = process.env): string {
  if (isOllamaEnabled(env)) return 'ollama';
  if (env.OPENAI_API_KEY) return 'gpt-4o';
  if (env.ANTHROPIC_API_KEY) return 'claude-3.5-sonnet';
  return 'gpt-4o';
}

export function createGatewayProviders(env: NodeJS.ProcessEnv = process.env): GatewayProviders {
  return {
    ollama: isOllamaEnabled(env) ? new OllamaProvider() : undefined,
    openai: env.OPENAI_API_KEY ? new OpenAIProvider({ apiKey: env.OPENAI_API_KEY }) : undefined,
    anthropic: env.ANTHROPIC_API_KEY
      ? new AnthropicProvider({ apiKey: env.ANTHROPIC_API_KEY })
      : undefined,
  };
}
