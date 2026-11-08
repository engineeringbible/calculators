/**
 * serve.js — zero-dependency static file server for local use.
 *
 * Browsers block ES-module imports from file:// URLs (origin "null"), so the demo pages must be
 * served over http. Run `node serve.js` and open http://localhost:8000/ — everything stays offline.
 * `python -m http.server 8000` from this folder does the same job.
 */
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.argv[2]) || 8000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function resolvePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const relative = normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '');
  let full = join(ROOT, relative);
  if (!full.startsWith(ROOT)) return null;
  try {
    if (statSync(full).isDirectory()) full = join(full, 'index.html');
    statSync(full);
    return full;
  } catch {
    return null;
  }
}

createServer((request, response) => {
  const filePath = resolvePath(request.url || '/');
  if (!filePath) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(`Not found: ${request.url}`);
    return;
  }
  response.writeHead(200, {
    'Content-Type': MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  createReadStream(filePath).pipe(response);
}).listen(PORT, () => {
  console.log(`Engineering calculators served from ${ROOT.replace(new RegExp(`\\${sep}$`), '')}`);
  console.log(`Open http://localhost:${PORT}/  (Ctrl+C to stop)`);
});
