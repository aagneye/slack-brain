import type { Prisma } from '@prisma/client';
import { prisma } from './client.js';

function asJson(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

/**
 * Thin repository helpers. The pipeline and API talk to these instead of Prisma
 * directly, keeping query logic in one place and the call sites readable.
 */

export const jobs = {
  create(data: {
    workspaceId: string;
    requestedBy: string;
    taskText: string;
    sourceChannel?: string;
    threadTs?: string;
  }) {
    return prisma.contextJob.create({ data });
  },

  setStatus(id: string, status: string, stageDetail?: Record<string, unknown>) {
    return prisma.contextJob.update({
      where: { id },
      data: { status, ...(stageDetail ? { stageDetail: asJson(stageDetail) } : {}) },
    });
  },

  markDone(id: string) {
    return prisma.contextJob.update({
      where: { id },
      data: { status: 'done', completedAt: new Date() },
    });
  },

  markFailed(id: string, error: string) {
    return prisma.contextJob.update({
      where: { id },
      data: { status: 'failed', error, completedAt: new Date() },
    });
  },

  byId(id: string) {
    return prisma.contextJob.findUnique({ where: { id } });
  },
};

export const packs = {
  byId(id: string) {
    return prisma.contextPack.findUnique({ where: { id } });
  },
  bySlug(slug: string) {
    return prisma.contextPack.findUnique({ where: { permalinkSlug: slug } });
  },
  listForWorkspace(workspaceId: string, take = 25) {
    return prisma.contextPack.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  },
};

export const audit = {
  record(event: {
    workspaceId: string;
    actor?: string;
    jobId?: string;
    eventType: string;
    payload?: Record<string, unknown>;
  }) {
    return prisma.auditEvent.create({
      data: { ...event, payload: asJson(event.payload ?? {}) },
    });
  },
};

export const connectors = {
  listForWorkspace(workspaceId: string) {
    return prisma.connector.findMany({ where: { workspaceId } });
  },
  upsert(data: {
    workspaceId: string;
    kind: string;
    tokenRef: string;
    scopes?: string[];
  }) {
    return prisma.connector.create({
      data: { ...data, scopes: data.scopes ?? [] },
    });
  },
};
