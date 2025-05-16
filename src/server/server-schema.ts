import z from 'zod';

export const WorkerMessageSchema = z.object({
    requestType: z.enum(['http']),
    headers: z.any(),
    body: z.any(),
    url: z.string(),
})

export type WorkerMessageType = z.infer<typeof WorkerMessageSchema>

