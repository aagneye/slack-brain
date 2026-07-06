import type { EmbeddingPort, LLMPort } from '@cpe/core';
import type { GatewayProviders } from './gateway.js';
import {
  HashingEmbeddings,
  OllamaEmbeddings,
  OpenAIEmbeddings,
} from './embeddings.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { OllamaProvider } from './providers/ollama.js';
import { OpenAIProvider } from './providers/openai.js';

export interface SendModelOption {
  id: string;
  label: string;
  primary?: boolean;
}

function env(env: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  return env;
}

/** True when Ollama should be used for chat, compression, and Send-to-AI. */
export function isOllamaEnabled(processEnv: NodeJS.ProcessEnv = process.env): boolean {
  const e = env(processEnv);
  if (e.OLLAMA_ENABLED === 'false') return false;
  if (e.OLLAMA_ENABLED === 'true') return true;
  if (e.OLLAMA_BASE_URL) return true;
  const nodeEnv = e.NODE_ENV ?? 'development';
  if (nodeEnv !== 'production' && !e.OPENAI_API_KEY && !e.ANTHROPIC_API_KEY) return true;
  return false;
}

export function ollamaBaseUrl(processEnv: NodeJS.ProcessEnv = process.env): string {
  return (processEnv.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(/\/$/, '');
}

export function ollamaChatModel(processEnv: NodeJS.ProcessEnv = process.env): string {
  return processEnv.OLLAMA_CHAT_MODEL ?? 'llama3.2';
}

/** Model id passed to LLMPort.complete during pipeline compression. */
export function compressionModel(processEnv: NodeJS.ProcessEnv = process.env): string {
  if (isOllamaEnabled(processEnv)) {
    const name = ollamaChatModel(processEnv);
    return name.startsWith('ollama:') ? name : `ollama:${name}`;
  }
  if (processEnv.OPENAI_API_KEY) return 'gpt-4o';
  if (processEnv.ANTHROPIC_API_KEY) return 'claude-3.5-sonnet';
  return 'gpt-4o';
}

export function createEmbeddings(processEnv: NodeJS.ProcessEnv = process.env): EmbeddingPort {
  const provider = processEnv.EMBEDDINGS_PROVIDER ?? 'openai';
  if (provider === 'ollama' || (isOllamaEnabled(processEnv) && !processEnv.OPENAI_API_KEY)) {
    return new OllamaEmbeddings({
      baseUrl: ollamaBaseUrl(processEnv),
      model: processEnv.OLLAMA_EMBED_MODEL,
    });
  }
  if (processEnv.OPENAI_API_KEY) {
    return new OpenAIEmbeddings({ apiKey: processEnv.OPENAI_API_KEY });
  }
  return new HashingEmbeddings();
}

class NoopLLM implements LLMPort {
  async complete(): Promise<{ text: string }> {
    return { text: '' };
  }
}

/** LLM for pipeline compression summaries. */
export function createPipelineLLM(processEnv: NodeJS.ProcessEnv = process.env): LLMPort {
  if (isOllamaEnabled(processEnv)) {
    return new OllamaProvider({
      baseUrl: ollamaBaseUrl(processEnv),
      defaultModel: ollamaChatModel(processEnv),
    });
  }
  if (processEnv.OPENAI_API_KEY) {
    return new OpenAIProvider({ apiKey: processEnv.OPENAI_API_KEY });
  }
  if (processEnv.ANTHROPIC_API_KEY) {
    return new AnthropicProvider({ apiKey: processEnv.ANTHROPIC_API_KEY });
  }
  return new NoopLLM();
}

/** Providers wired into the Send-to-AI gateway (web + Slack interactions). */
export function createGatewayProviders(processEnv: NodeJS.ProcessEnv = process.env): GatewayProviders {
  const providers: GatewayProviders = {};
  if (isOllamaEnabled(processEnv)) {
    providers.ollama = new OllamaProvider({
      baseUrl: ollamaBaseUrl(processEnv),
      defaultModel: ollamaChatModel(processEnv),
    });
  }
  if (processEnv.OPENAI_API_KEY) {
    providers.openai = new OpenAIProvider({ apiKey: processEnv.OPENAI_API_KEY });
  }
  if (processEnv.ANTHROPIC_API_KEY) {
    providers.anthropic = new AnthropicProvider({ apiKey: processEnv.ANTHROPIC_API_KEY });
  }
  return providers;
}

/** Models shown in the portal Send-to-AI bar and Slack Pack card buttons. */
export function getAvailableSendModels(processEnv: NodeJS.ProcessEnv = process.env): SendModelOption[] {
  const models: SendModelOption[] = [];
  const ollamaOn = isOllamaEnabled(processEnv);

  if (ollamaOn) {
    models.push({
      id: 'ollama',
      label: `Ollama (${ollamaChatModel(processEnv)})`,
      primary: true,
    });
  }
  if (processEnv.OPENAI_API_KEY) {
    models.push({ id: 'gpt-4o', label: 'GPT-4o', primary: !ollamaOn });
  }
  if (processEnv.ANTHROPIC_API_KEY) {
    models.push({
      id: 'claude-3.5-sonnet',
      label: 'Claude 3.5',
      primary: !ollamaOn && !processEnv.OPENAI_API_KEY,
    });
  }
  models.push({ id: 'cursor', label: 'Open in Cursor' });
  return models;
}
