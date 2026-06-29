import type {
  Confidence,
  ConfidenceFactors,
  Contradiction,
  MissingInfo,
  RetrievedItem,
} from '@cpe/shared';

/**
 * Confidence scoring (stage 6).
 *
 * Transparent, reproducible formula. Every factor and the final score are
 * returned so the UI can answer "why 62%?".
 *
 *   score = 100 * clamp(
 *     w_cov*coverage + w_agree*agreement + w_rec*recency + w_src*sourceQuality
 *     - w_gap*gapPenalty, 0, 1)
 */

export interface ConfidenceWeights {
  coverage: number;
  agreement: number;
  recency: number;
  sourceQuality: number;
  gapPenalty: number;
}

const DEFAULT_WEIGHTS: ConfidenceWeights = {
  coverage: 0.3,
  agreement: 0.25,
  recency: 0.2,
  sourceQuality: 0.15,
  gapPenalty: 0.3,
};

const SOURCE_QUALITY: Record<string, number> = {
  incident: 1,
  deploy: 0.9,
  github: 0.85,
  jira: 0.7,
  confluence: 0.65,
  notion: 0.6,
  slack: 0.55,
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export interface ConfidenceInput {
  items: RetrievedItem[];
  requiredInfo: string[];
  missing: MissingInfo[];
  contradictions: Contradiction[];
  now?: number;
  weights?: Partial<ConfidenceWeights>;
}

export function computeConfidence(input: ConfidenceInput): Confidence {
  const w = { ...DEFAULT_WEIGHTS, ...input.weights };
  const now = input.now ?? Date.now();
  const { items, requiredInfo, missing, contradictions } = input;

  const coverage =
    requiredInfo.length === 0 ? 1 : clamp01((requiredInfo.length - missing.length) / requiredInfo.length);

  const agreement = contradictions.length === 0 ? 1 : clamp01(1 - contradictions.length / Math.max(3, items.length));

  const recencyScores = items.map((it) => {
    const ts = it.sourceUpdatedAt ?? it.sourceCreatedAt;
    if (!ts) return 0.3;
    const ageDays = (now - new Date(ts).getTime()) / 86_400_000;
    return 1 / (1 + ageDays / 14);
  });
  const recency = recencyScores.length ? recencyScores.reduce((a, b) => a + b, 0) / recencyScores.length : 0;

  const qualityScores = items.map((it) => SOURCE_QUALITY[it.source] ?? 0.5);
  const sourceQuality = qualityScores.length
    ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
    : 0;

  const gapPenalty = requiredInfo.length === 0 ? 0 : clamp01(missing.length / requiredInfo.length);

  const factors: ConfidenceFactors = { coverage, agreement, recency, sourceQuality, gapPenalty };

  const raw =
    w.coverage * coverage +
    w.agreement * agreement +
    w.recency * recency +
    w.sourceQuality * sourceQuality -
    w.gapPenalty * gapPenalty;

  const score = Math.round(100 * clamp01(raw));

  return { score, factors, rationale: buildRationale(score, factors, missing, contradictions) };
}

function buildRationale(
  score: number,
  f: ConfidenceFactors,
  missing: MissingInfo[],
  contradictions: Contradiction[],
): string {
  const parts: string[] = [`Confidence ${score}/100.`];
  parts.push(`Coverage ${(f.coverage * 100).toFixed(0)}%, recency ${(f.recency * 100).toFixed(0)}%.`);
  if (missing.length) parts.push(`${missing.length} required item(s) missing.`);
  if (contradictions.length) parts.push(`${contradictions.length} contradiction(s) detected.`);
  return parts.join(' ');
}
