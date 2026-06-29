import type { ConnectorPort, SearchQuery } from '@cpe/core';
import type { RetrievedItem } from '@cpe/shared';
import { contentHash, getJson } from './util.js';

/**
 * GitHub connector — searches issues and pull requests via the GitHub Search API
 * and normalizes them into RetrievedItem. Requires a token with read access.
 */

interface GitHubSearchResponse {
  items?: Array<{
    id: number;
    number: number;
    title: string;
    body: string | null;
    html_url: string;
    user?: { login: string };
    created_at: string;
    updated_at: string;
    pull_request?: unknown;
    repository_url?: string;
  }>;
}

export interface GitHubConnectorOptions {
  token: string;
  /** Optional `org/repo` scoping or org filter, e.g. "acme" or "acme/checkout". */
  scope?: string;
  apiBase?: string;
}

export class GitHubConnector implements ConnectorPort {
  readonly kind = 'github' as const;
  private readonly token: string;
  private readonly scope?: string;
  private readonly apiBase: string;

  constructor(opts: GitHubConnectorOptions) {
    this.token = opts.token;
    this.scope = opts.scope;
    this.apiBase = opts.apiBase ?? 'https://api.github.com';
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'context-pack-engine',
    };
  }

  async search(query: SearchQuery): Promise<RetrievedItem[]> {
    const terms = [query.task, ...query.entities].join(' ');
    const scoped = this.scope
      ? this.scope.includes('/')
        ? `repo:${this.scope}`
        : `org:${this.scope}`
      : '';
    const q = encodeURIComponent(`${terms} ${scoped}`.trim());
    const url = `${this.apiBase}/search/issues?q=${q}&per_page=${query.limit}&sort=updated`;
    const data = await getJson<GitHubSearchResponse>(url, this.headers());

    return (data.items ?? []).map((it) => {
      const isPr = Boolean(it.pull_request);
      return {
        id: `github:${it.id}`,
        source: 'github',
        externalId: String(it.number),
        type: isPr ? 'pull_request' : 'issue',
        title: it.title,
        body: it.body ?? '',
        url: it.html_url,
        author: it.user?.login,
        sourceCreatedAt: it.created_at,
        sourceUpdatedAt: it.updated_at,
        contentHash: contentHash([it.title, it.body ?? '']),
        metadata: { repository: it.repository_url },
      } satisfies RetrievedItem;
    });
  }

  async health(): Promise<{ ok: boolean; detail?: string }> {
    try {
      await getJson(`${this.apiBase}/rate_limit`, this.headers());
      return { ok: true };
    } catch (e) {
      return { ok: false, detail: (e as Error).message };
    }
  }
}
