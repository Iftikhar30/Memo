import { jsPDF } from 'jspdf';
import { SavedMemo, UserSettings, MemoExportOptions } from '../types';
import { generateMemoImage } from './imageExport';

export async function generateMemoPDF(
  memo: SavedMemo,
  settings: UserSettings,
  options?: MemoExportOptions
): Promise<{ blob: Blob; filename: string }> {
  // Generate the canvas image first to preserve all Bengali glyphs and styling
  const { dataUrl } = await generateMemoImage(memo, settings, 'image/png', options);

  // Create an A4 or portrait document matching aspect ratio
  const img = new Image();
  img.src = dataUrl;
  await new Promise((resolve) => {
    img.onload = resolve;
  });

  const pdfWidth = 210; // mm (A4 width)
  const pdfHeight = (img.height * pdfWidth) / img.width;

  // Initialize jsPDF with custom height matching content
  const doc = new jsPDF({
    orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
    unit: 'mm',
    format: [pdfWidth, pdfHeight],
  });

  doc.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);

  const cleanTitle = (memo.title || 'memo').replace(/[^\w\d\-_]/g, '_');
  const filename = `${cleanTitle}_${Date.now()}.pdf`;

  const blob = doc.output('blob');
  return { blob, filename };
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
