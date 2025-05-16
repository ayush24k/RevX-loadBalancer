import cluster, { Worker } from 'node:cluster';
import { ConfigSchemaType, rootConfigSchema } from '../config/config-schema';
import http, { request } from 'node:http'
import { WorkerMessageReplySchema, WorkerMessageReplyType, WorkerMessageSchema, WorkerMessageType } from './server-schema';
import { date } from 'zod';

interface masterConfig {
    port: number;
    workerCount: number;
    config: ConfigSchemaType;
}

export async function masterProcess(config: masterConfig) {
    const { workerCount, port } = config;

    const WORKER_POOL: Worker[] = [];

    if (cluster.isPrimary) {
        console.log("Mater process is up 🚀")

        for (let i = 0; i < workerCount; i++) {
            const worker = cluster.fork({ config: JSON.stringify(config.config) })
            WORKER_POOL.push(worker);
            console.log(`Master Process: Worker node is up: ${i}`);
        }

        // create server
        const server = http.createServer((req, res) => {
            const index = Math.floor(Math.random() * WORKER_POOL.length);
            const worker = WORKER_POOL[index];

            const payload: WorkerMessageType = {
                requestType: 'http',
                headers: req.headers,
                body: null,
                url: req.url as string,
            }

            worker.send(JSON.stringify(payload));

            worker.on('message', async (workerReply) => {
                const reply = await WorkerMessageReplySchema.parseAsync(JSON.parse(workerReply as string))

                if (reply.errorCode) {
                    res.writeHead(parseInt(reply.errorCode))
                    res.end(reply.error);
                    return
                }

                res.writeHead(200);
                res.end(reply.data);
                return;
            })
        });

        server.listen(port, () => {
            console.log(`RevX is listening on PORT ${port}`)
        })
    } else {
        console.log("woker node ");
        const config = await rootConfigSchema.parseAsync(JSON.parse(process.env.config as string));

        process.on('message', async (message) => {
            const messageValidated = await WorkerMessageSchema.parseAsync(JSON.parse(message as string))

            const reuqestURL = messageValidated.url;
            const rule = config.server.rules.find(e => e.path === reuqestURL)

            if (!rule) {
                const reply: WorkerMessageReplyType = {
                    errorCode: '404',
                    error: "Rule not found"
                };
                if (process.send) return process.send(JSON.stringify(reply));
            }

            const upstreamID = rule?.upstreams[0];
            const upstream = config.server.upstreams.find(e => e.id === upstreamID);


            if (!upstream) {
                const reply: WorkerMessageReplyType = {
                    errorCode: '404',
                    error: "Upstream not found"
                };
                if (process.send) return process.send(JSON.stringify(reply));
            }

            const request = http.request({ host: upstream?.url, path: reuqestURL, method: 'GET' }, (proxyRes) => {
                let body ='';
                proxyRes.on('data', (chunk) => {
                    body = body + date;
                })

                proxyRes.on('end', () => {
                    const reply: WorkerMessageReplyType = {
                        data: body
                    }
                    if (process.send) return process.send(JSON.stringify(reply));
                })
            });
            request.end();
        })
    }
}
