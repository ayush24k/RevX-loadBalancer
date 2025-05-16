import { error } from 'node:console';
import z, { date } from 'zod';

export const WorkerMessageSchema = z.object({
    requestType: z.enum(['http']),
    headers: z.any(),
    body: z.any(),
    url: z.string(),
})

export const WorkerMessageReplySchema = z.object({
    data: z.string().optional(),
    error: z.string().optional(),
    errorCode: z.enum(['500', '404']).optional(),
})

export type WorkerMessageType = z.infer<typeof WorkerMessageSchema>
export type WorkerMessageReplyType = z.infer<typeof WorkerMessageReplySchema>

