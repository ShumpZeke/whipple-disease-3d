// Start a temporary static preview of dist/ for the probe/screenshot scripts, then stop it.
import { preview } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export async function withPreview(fn, port = 4173) {
  const server = await preview({ root, logLevel: 'silent', preview: { port, strictPort: true, open: false } });
  try {
    return await fn(`http://localhost:${port}/`);
  } finally {
    await new Promise((r) => server.httpServer.close(r));
  }
}
