import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEED_DIGITAL } from '../src/data/seed-catalog.js';
import { SEED_COURSES } from '../src/data/seed-courses.js';

const OUTPUT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/files');
const NOTICE = 'Archivo de muestra del prototipo academico OmniMelody.';

function escapePdfText(text) {
  return text.replace(/[\()]/g, char => `\${char}`).replace(/[^\x20-\xFF]/g, '');
}

function contentStream(title, description) {
  const lines = [[24, 720, 'OmniMelody'], [18, 680, title], [11, 650, description], [10, 120, NOTICE]];
  return lines.map(([size, y, text]) => `BT /F1 ${size} Tf 72 ${y} Td (${escapePdfText(text)}) Tj ET`).join('\n');
}

function buildPdf(title, description) {
  const stream = contentStream(title, description);
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  ];
  let body = '%PDF-1.4\n';
  const offsets = objects.map((object, index) => {
    const offset = Buffer.byteLength(body, 'latin1');
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const xrefStart = Buffer.byteLength(body, 'latin1');
  const xref = offsets.map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${xref}`;
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(body, 'latin1');
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
for (const item of [...SEED_DIGITAL, ...SEED_COURSES]) {
  fs.writeFileSync(path.join(OUTPUT_DIR, `${item.archivo}.pdf`), buildPdf(item.nombre, item.descripcion));
}
