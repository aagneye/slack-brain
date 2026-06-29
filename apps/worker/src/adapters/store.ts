import type { StorePort } from '@cpe/core';
import type { ContextPack, RetrievedItem } from '@cpe/shared';
import { prisma, jobs as jobRepo } from '@cpe/db';

/**
 * Prisma-backed store adapter. Persists retrieved items, the final Pack (plus its
 * contradictions and missing-info rows), and audit events.
 */
export class PrismaStore implements StorePort {
  async saveItems(jobId: string, items: RetrievedItem[]): Promise<void> {
    if (items.length === 0) return;
    await prisma.retrievedItem.createMany({
      data: items.map((it) => ({
        jobId,
        source: it.source,
        externalId: it.externalId,
        type: it.type,
        title: it.title,
        body: it.body,
        url: it.url,
        author: it.author,
        sourceCreatedAt: it.sourceCreatedAt ? new Date(it.sourceCreatedAt) : null,
        sourceUpdatedAt: it.sourceUpdatedAt ? new Date(it.sourceUpdatedAt) : null,
        contentHash: it.contentHash,
        relevance: it.relevance,
        flags: it.flags ?? {},
        metadata: (it.metadata ?? {}) as object,
      })),
    });
  }

  async savePack(pack: ContextPack): Promise<void> {
    const job = await jobRepo.byId(pack.jobId);
    if (!job) throw new Error(`job ${pack.jobId} not found`);

    await prisma.contextPack.create({
      data: {
        id: pack.id,
        jobId: pack.jobId,
        workspaceId: job.workspaceId,
        permalinkSlug: pack.permalinkSlug,
        confidence: pack.confidence.score,
        confidenceFactors: pack.confidence.factors as object,
        packJson: pack as unknown as object,
        contradictions: {
          create: pack.contradictions.map((c) => ({
            itemAId: c.itemAId,
            itemBId: c.itemBId,
            claimA: c.claimA,
            claimB: c.claimB,
            reason: c.reason,
            confidence: c.confidence,
          })),
        },
        missingInfo: {
          create: pack.missingInformation.map((m) => ({
            requirement: m.requirement,
            reason: m.reason,
          })),
        },
      },
    });

    await jobRepo.markDone(pack.jobId);
  }

  async recordAudit(event: {
    workspaceId: string;
    jobId?: string;
    actor?: string;
    eventType: string;
    payload?: Record<string, unknown>;
  }): Promise<void> {
    await prisma.auditEvent.create({
      data: {
        workspaceId: event.workspaceId,
        jobId: event.jobId,
        actor: event.actor,
        eventType: event.eventType,
        payload: (event.payload ?? {}) as object,
      },
    });
  }
}
