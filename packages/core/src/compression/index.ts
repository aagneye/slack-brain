import type { RetrievedItem } from '@cpe/shared';
import type { LLMPort } from '../ports.js';

/**
 * Context compression (stage 5).
 *
 * Produces a concise, citation-preserving summary per item. V1 falls back to
 * extractive truncation; when an LLM is available it generates abstractive
 * summaries within a token budget. Returns a map of itemId -> summary.
 */

export interface CompressOptions {
  maxCharsPerItem?: number;
  llm?: LLMPort | null;
  /** Model id passed to llm.complete (e.g. ollama, gpt-4o). */
  model?: string;
}

function extractive(item: RetrievedItem, maxChars: number): string {
  const text = item.body?.trim() ?? '';
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars).trimEnd()}…`;
}

export async function compressItems(
  items: RetrievedItem[],
  opts: CompressOptions = {},
): Promise<Map<string, string>> {
  const maxChars = opts.maxCharsPerItem ?? 320;
  const out = new Map<string, string>();

  for (const item of items) {
    if (!opts.llm) {
      out.set(item.id, extractive(item, maxChars));
      continue;
    }
    try {
      const { text } = await opts.llm.complete({
        model: opts.model ?? 'gpt-4o',
        system: 'Summarize the content in 1-2 sentences. Preserve specifics (names, IDs, dates). Do not invent.',
        prompt: `${item.title}\n\n${item.body}`,
        maxTokens: 120,
      });
      out.set(item.id, text.trim() || extractive(item, maxChars));
    } catch {
      out.set(item.id, extractive(item, maxChars));
    }
  }
  return out;
}
