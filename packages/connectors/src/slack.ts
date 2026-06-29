import type { ConnectorPort, SearchQuery } from '@cpe/core';
import type { RetrievedItem } from '@cpe/shared';
import { contentHash, getJson } from './util.js';

/**
 * Slack connector — queries the Slack search API (real-time message search) and
 * normalizes results into RetrievedItem. Requires a user/bot token with
 * `search:read`.
 *
 * Implements ConnectorPort so the engine treats it identically to every other
 * source (MCP-style uniform contract).
 */

interface SlackSearchResponse {
  ok: boolean;
  error?: string;
  messages?: {
    matches?: Array<{
      ts: string;
      text: string;
      permalink: string;
      username?: string;
      channel?: { id: string; name?: string };
    }>;
  };
}

export interface SlackConnectorOptions {
  token: string;
  apiBase?: string;
}

export class SlackConnector implements ConnectorPort {
  readonly kind = 'slack' as const;
  private readonly token: string;
  private readonly apiBase: string;

  constructor(opts: SlackConnectorOptions) {
    this.token = opts.token;
    this.apiBase = opts.apiBase ?? 'https://slack.com/api';
  }

  async search(query: SearchQuery): Promise<RetrievedItem[]> {
    const q = encodeURIComponent(query.task);
    const url = `${this.apiBase}/search.messages?query=${q}&count=${query.limit}&sort=timestamp`;
    const data = await getJson<SlackSearchResponse>(url, {
      Authorization: `Bearer ${this.token}`,
    });
    if (!data.ok) throw new Error(`slack search failed: ${data.error ?? 'unknown'}`);

    const matches = data.messages?.matches ?? [];
    return matches.map((m) => {
      const tsMs = Math.floor(Number(m.ts) * 1000);
      return {
        id: `slack:${m.channel?.id ?? 'dm'}:${m.ts}`,
        source: 'slack',
        externalId: m.ts,
        type: 'message',
        title: m.channel?.name ? `#${m.channel.name}` : 'Slack message',
        body: m.text ?? '',
        url: m.permalink,
        author: m.username,
        sourceCreatedAt: new Date(tsMs).toISOString(),
        sourceUpdatedAt: new Date(tsMs).toISOString(),
        contentHash: contentHash([m.text]),
        metadata: { channel: m.channel },
      } satisfies RetrievedItem;
    });
  }

  async health(): Promise<{ ok: boolean; detail?: string }> {
    try {
      const data = await getJson<{ ok: boolean; error?: string }>(`${this.apiBase}/auth.test`, {
        Authorization: `Bearer ${this.token}`,
      });
      return { ok: data.ok, detail: data.error };
    } catch (e) {
      return { ok: false, detail: (e as Error).message };
    }
  }
}
