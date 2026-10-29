import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT ?? 8080);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.pdf': 'application/pdf', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
};

function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const target = path.normalize(path.join(ROOT, decoded === '/' ? 'index.html' : decoded));
  return target.startsWith(ROOT) ? target : null;
}

http.createServer((request, response) => {
  const file = resolveFile(request.url);
  if (!file || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    response.writeHead(404).end('No encontrado');
    return;
  }
  response.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(response);
}).listen(PORT, () => process.stdout.write(`OmniMelody en http://localhost:${PORT}\n`));
