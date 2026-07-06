import type { EmbeddingPort } from '@cpe/core';

/**
 * OpenAI embeddings adapter (EmbeddingPort) used by ranking, dedupe and
 * contradiction candidate selection. Batches inputs in a single request.
 */
export interface OpenAIEmbeddingsOptions {
  apiKey: string;
  model?: string;
  apiBase?: string;
}

interface EmbeddingResponse {
  data: Array<{ embedding: number[] }>;
}

export class OpenAIEmbeddings implements EmbeddingPort {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly apiBase: string;

  constructor(opts: OpenAIEmbeddingsOptions) {
    this.apiKey = opts.apiKey;
    this.model = opts.model ?? 'text-embedding-3-small';
    this.apiBase = opts.apiBase ?? 'https://api.openai.com/v1';
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const res = await fetch(`${this.apiBase}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: this.model, input: texts }),
    });
    if (!res.ok) throw new Error(`embeddings failed: ${res.status} ${res.statusText}`);
    const json = (await res.json()) as EmbeddingResponse;
    return json.data.map((d) => d.embedding);
  }
}

/** Deterministic, offline fallback embedding for local dev/tests without an API key. */
export class HashingEmbeddings implements EmbeddingPort {
  constructor(private readonly dims = 256) {}
  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((t) => {
      const vec = new Array(this.dims).fill(0);
      for (const token of t.toLowerCase().split(/\W+/).filter(Boolean)) {
        let h = 0;
        for (let i = 0; i < token.length; i++) h = (h * 31 + token.charCodeAt(i)) | 0;
        vec[Math.abs(h) % this.dims] += 1;
      }
      const norm = Math.sqrt(vec.reduce((a, b) => a + b * b, 0)) || 1;
      return vec.map((v) => v / norm);
    });
  }
}

/** Ollama /api/embed — used for ranking and dedupe when running fully local. */
export class OllamaEmbeddings implements EmbeddingPort {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(opts: { baseUrl?: string; model?: string } = {}) {
    this.baseUrl = (opts.baseUrl ?? process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(
      /\/$/,
      '',
    );
    this.model = opts.model ?? process.env.OLLAMA_EMBED_MODEL ?? 'nomic-embed-text';
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const res = await fetch(`${this.baseUrl}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, input: texts }),
    });
    if (!res.ok) {
      throw new Error(`ollama embeddings failed: ${res.status} ${res.statusText}`);
    }
    const json = (await res.json()) as { embeddings?: number[][] };
    return json.embeddings ?? [];
  }
}
