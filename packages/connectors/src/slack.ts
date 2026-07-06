import type { ConnectorPort, SearchQuery } from '@cpe/core';
import type { RetrievedItem } from '@cpe/shared';
import { assertSlackSearchToken } from '@cpe/shared';
import { contentHash, getJson } from './util.js';

/**
 * Slack **search** connector — calls `search.messages` with a **user token**
 * (`xoxp-`) that has `search:read`. Results are scoped to what that user can see.
 *
 * Do NOT pass SLACK_BOT_TOKEN here — Slack rejects bot tokens for search.
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

export interface SlackSearchConnectorOptions {
  /** User OAuth token (xoxp-) with search:read */
  userToken: string;
  apiBase?: string;
}

export class SlackSearchConnector implements ConnectorPort {
  readonly kind = 'slack' as const;
  private readonly userToken: string;
  private readonly apiBase: string;

  constructor(opts: SlackSearchConnectorOptions) {
    assertSlackSearchToken(opts.userToken);
    this.userToken = opts.userToken;
    this.apiBase = opts.apiBase ?? 'https://slack.com/api';
  }

  async search(query: SearchQuery): Promise<RetrievedItem[]> {
    const q = encodeURIComponent(query.task);
    const url = `${this.apiBase}/search.messages?query=${q}&count=${query.limit}&sort=timestamp`;
    const data = await getJson<SlackSearchResponse>(url, {
      Authorization: `Bearer ${this.userToken}`,
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
        metadata: { channel: m.channel, searchScope: 'user' },
      } satisfies RetrievedItem;
    });
  }

  async health(): Promise<{ ok: boolean; detail?: string }> {
    try {
      const data = await getJson<{ ok: boolean; error?: string }>(`${this.apiBase}/auth.test`, {
        Authorization: `Bearer ${this.userToken}`,
      });
      return { ok: data.ok, detail: data.error };
    } catch (e) {
      return { ok: false, detail: (e as Error).message };
    }
  }
}

/** @deprecated Use SlackSearchConnector — bot tokens cannot search. */
export { SlackSearchConnector as SlackConnector };
export type { SlackSearchConnectorOptions as SlackConnectorOptions };
