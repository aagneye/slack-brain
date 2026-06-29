import { z } from 'zod';

/** Request body for creating a context job (API + Slack command). */
export const createJobSchema = z.object({
  task: z.string().min(3).max(2000),
  channel: z.string().optional(),
  threadTs: z.string().optional(),
});
export type CreateJobInput = z.infer<typeof createJobSchema>;

/** Request body for sending a Pack to an LLM. */
export const sendPackSchema = z.object({
  model: z.enum(['claude-3.5-sonnet', 'claude-3.7-sonnet', 'gpt-4o', 'gpt-4.1', 'cursor']),
  includedItemIds: z.array(z.string()).optional(),
});
export type SendPackInput = z.infer<typeof sendPackSchema>;

/** Feedback on a pack or an individual item. */
export const feedbackSchema = z.object({
  targetType: z.enum(['pack', 'item']),
  targetId: z.string(),
  rating: z.union([z.literal(1), z.literal(-1)]),
  note: z.string().max(1000).optional(),
});
export type FeedbackInput = z.infer<typeof feedbackSchema>;

/** Toggle which items are included before sending to an LLM. */
export const patchItemsSchema = z.object({
  items: z.array(z.object({ id: z.string(), included: z.boolean() })),
});
export type PatchItemsInput = z.infer<typeof patchItemsSchema>;
