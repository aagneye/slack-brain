import type { ContextPack, JobStatus, RetrievedItem } from '@cpe/shared';
import type { PipelineDeps } from './ports.js';
import { understandTask } from './task-understanding/index.js';
import { rankItems } from './ranking/index.js';
import { dedupe, flagStaleness, detectGaps, detectContradictions } from './verification/index.js';
import { compressItems } from './compression/index.js';
import { computeConfidence } from './confidence/index.js';
import { buildPack } from './pack/generator.js';

/**
 * The Context Pack pipeline — the staged state machine that turns a task into a
 * verified ContextPack. It is pure orchestration over injected ports, so it runs
 * identically in the worker, in tests, or anywhere PipelineDeps is provided.
 */

export interface RunPipelineInput {
  jobId: string;
  workspaceId: string;
  task: string;
  createdBy: string;
  deps: PipelineDeps;
  enableContradictions?: boolean;
}

export async function runPipeline(input: RunPipelineInput): Promise<ContextPack> {
  const { jobId, workspaceId, task, deps } = input;

  const emit = async (stage: JobStatus, detail?: Record<string, unknown>) => {
    await deps.events.publish({ jobId, stage, detail, at: new Date().toISOString() });
  };
  const audit = (eventType: string, payload?: Record<string, unknown>) =>
    deps.store.recordAudit({ workspaceId, jobId, actor: 'system', eventType, payload });

  // 1. Understand
  await emit('understanding');
  const understanding = understandTask(task);
  await audit('job.understood', { intent: understanding.intent, entities: understanding.entities });

  // 2. Retrieve (fan-out, graceful degradation)
  await emit('retrieving');
  const limit = 12;
  const wanted = new Set(understanding.sources);
  const active = deps.connectors.filter((c) => wanted.has(c.kind));
  const results = await Promise.allSettled(
    active.map((c) => c.search({ task, entities: understanding.entities, limit })),
  );

  let items: RetrievedItem[] = [];
  const perSource: Record<string, number> = {};
  let degraded = false;
  results.forEach((res, i) => {
    const kind = active[i]!.kind;
    if (res.status === 'fulfilled') {
      perSource[kind] = res.value.length;
      items.push(...res.value);
    } else {
      degraded = true;
      perSource[kind] = -1;
    }
  });
  await audit('job.retrieved', { perSource, degraded });
  await emit('retrieving', { sources: perSource });

  // Embed for semantic stages.
  const taskEmbedding = (await deps.embeddings.embed([task]))[0] ?? [];
  const texts = items.map((it) => `${it.title}\n${it.body}`);
  const embeddings = texts.length ? await deps.embeddings.embed(texts) : [];
  items = items.map((it, i) => ({ ...it, embedding: embeddings[i] }));

  // 3. Rank
  await emit('ranking');
  items = rankItems(items, { taskEmbedding, entities: understanding.entities });

  // 4. Verify
  await emit('verifying');
  const deduped = dedupe(items);
  items = flagStaleness(deduped.canonical);
  const missing = detectGaps(understanding.requiredInfo, items);
  const contradictions = input.enableContradictions
    ? await detectContradictions(items, null) // judge wired by the worker when enabled
    : [];
  await audit('job.verified', {
    duplicatesRemoved: deduped.duplicatesRemoved,
    missing: missing.length,
    contradictions: contradictions.length,
  });
  await emit('verifying', {
    duplicatesRemoved: deduped.duplicatesRemoved,
    missing: missing.length,
    contradictions: contradictions.length,
  });

  // 5. Compress
  await emit('compressing');
  const summaries = await compressItems(items, { llm: deps.llm });

  // 6. Score
  await emit('scoring');
  const confidence = computeConfidence({
    items,
    requiredInfo: understanding.requiredInfo,
    missing,
    contradictions,
  });

  // 7. Generate
  await emit('generating');
  const pack = buildPack({
    jobId,
    task,
    understanding,
    items,
    summaries,
    confidence,
    missing,
    contradictions,
    createdBy: input.createdBy,
  });

  await deps.store.saveItems(jobId, items);
  await deps.store.savePack(pack);
  await audit('pack.created', { packId: pack.id, confidence: confidence.score });
  await emit('done', { packId: pack.id, confidence: confidence.score });

  return pack;
}
