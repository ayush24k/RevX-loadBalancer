import cluster, { Worker } from 'node:cluster';
import { ConfigSchemaType, rootConfigSchema } from '../config/config-schema';
import http from 'node:http'
import { WorkerMessageSchema, WorkerMessageType } from './server-schema';

interface masterConfig {
    port: number;
    workerCount: number;
    config: ConfigSchemaType;
}

export async function masterProcess(config: masterConfig) {
    const { workerCount, port } = config;

    const WORKER_POOL:Worker[] = [];

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
        });

        server.listen(port, () => {
            console.log(`RevX is listening on PORT ${port}`)
        })
    } else {
        console.log("woker node ");
        const config = await rootConfigSchema.parseAsync(JSON.parse(process.env.config as string));

        process.on('message', async (message) => {
            const messageValidated = await WorkerMessageSchema.parseAsync(JSON.parse(message as string))
            console.log(messageValidated);
        })
    }
}
