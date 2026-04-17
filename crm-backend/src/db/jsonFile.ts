import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch (e: any) {
    if (e?.code === 'ENOENT') return fallback;
    throw e;
  }
}

export async function writeJsonFileAtomic(filePath: string, data: unknown): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  const tmpPath = `${filePath}.tmp`;
  const payload = JSON.stringify(data, null, 2);

  await fs.writeFile(tmpPath, payload, 'utf8');
  // Windows can't rename over an existing file reliably.
  try {
    await fs.rm(filePath, { force: true });
  } catch {
    // ignore
  }
  await fs.rename(tmpPath, filePath);
}

