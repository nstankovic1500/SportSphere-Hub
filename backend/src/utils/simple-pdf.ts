const escapePdfText = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const sanitizeText = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '');

const buildPageContent = (lines: string[]) => {
  const commands: string[] = ['BT', '/F1 12 Tf', '50 792 Td', '16 TL'];

  lines.forEach((line, index) => {
    const safeLine = escapePdfText(sanitizeText(line));

    if (index === 0) {
      commands.push(`(${safeLine}) Tj`);
      return;
    }

    commands.push('T*');
    commands.push(`(${safeLine}) Tj`);
  });

  commands.push('ET');

  return commands.join('\n');
};

const buildPdfBuffer = (pages: string[][]) => {
  const objects: string[] = [];
  const pageObjectNumbers: number[] = [];

  objects.push('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj');
  objects.push('2 0 obj << /Type /Pages /Kids [] /Count 0 >> endobj');

  let nextObjectNumber = 3;

  for (const pageLines of pages) {
    const pageObjectNumber = nextObjectNumber++;
    const contentObjectNumber = nextObjectNumber++;
    pageObjectNumbers.push(pageObjectNumber);

    const content = buildPageContent(pageLines);

    objects.push(
      `${pageObjectNumber} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${nextObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >> endobj`,
    );
    objects.push(
      `${contentObjectNumber} 0 obj << /Length ${Buffer.byteLength(content, 'utf8')} >> stream\n${content}\nendstream endobj`,
    );
  }

  objects.push(`${nextObjectNumber} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`);

  const pageKids = pageObjectNumbers.map((objectNumber) => `${objectNumber} 0 R`).join(' ');
  objects[1] = `2 0 obj << /Type /Pages /Kids [${pageKids}] /Count ${pageObjectNumbers.length} >> endobj`;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${object}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
};

export { buildPdfBuffer };
