import cluster from 'node:cluster';
import { ConfigSchemaType, rootConfigSchema } from './config-schema';
import http from 'node:http'

interface masterConfig {
    port: number;
    workerCount: number;
    config: ConfigSchemaType;
}

export async function masterProcess(config: masterConfig) {
    const { workerCount } = config;

    if (cluster.isPrimary) {
        console.log("Mater process is up 🚀")

        for (let i = 0; i < workerCount; i++) {
            cluster.fork({config: JSON.stringify(config.config)})
            console.log(`Master Process: Worker node is up: ${i}`);
        }

        // create server
        const server = http.createServer((req, res) => {

        });
    } else {
        console.log("woker node");
        const config = await rootConfigSchema.parseAsync(JSON.parse(process.env.config as string));
        
    }
}
