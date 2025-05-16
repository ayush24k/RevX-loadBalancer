import cluster, { Worker } from 'node:cluster';
import { ConfigSchemaType, rootConfigSchema } from '../config/config-schema';
import http from 'node:http'
import { WorkerMessageType } from './server-schema';

interface masterConfig {
    port: number;
    workerCount: number;
    config: ConfigSchemaType;
}

export async function masterProcess(config: masterConfig) {
    const { workerCount, port } = config;

    if (cluster.isPrimary) {
        console.log("Mater process is up 🚀")

        for (let i = 0; i < workerCount; i++) {
            cluster.fork({ config: JSON.stringify(config.config) })
            console.log(`Master Process: Worker node is up: ${i}`);
        }

        // create server
        const server = http.createServer((req, res) => {
            const index = Math.floor(Math.random() * workerCount);
            const worker: Worker = Object.values(!cluster.workers)[index];

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

        process.on('message', (message) => {
            console.log(message)
        })
    }
}
