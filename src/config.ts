import fs from 'fs/promises'

async function parseYAMLConfig(filePath:string) {
    const configFileContent = await fs.readFile(filePath);
}