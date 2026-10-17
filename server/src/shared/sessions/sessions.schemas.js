import { z } from 'zod';

export const createSessionSchema = z.object({
  scenarioId: z.string().min(1, 'scenarioId requis'),
});

export const sessionIdParamsSchema = z.object({
  sessionId: z.string().min(1),
});

export const updateStatusSchema = z.object({
  status: z.enum(['COMPLETED', 'ABANDONED']),
});
