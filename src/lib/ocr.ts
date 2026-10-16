// Client-side text extraction. Runs in the browser so report files never pass
// through a third-party OCR service.
//  - Images (PNG/JPEG): Tesseract.js (English).
//  - PDFs: text layer via pdf.js; if a page has no text (a scan), it is rendered
//    and OCR'd with Tesseract. Up to MAX_PDF_PAGES pages.

const MAX_PDF_PAGES = 10;

export type OcrProgress = (message: string, fraction?: number) => void;

async function ocrImage(source: Blob | HTMLCanvasElement, onProgress?: OcrProgress, label = 'Recognizing text') {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng', 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text') onProgress?.(label, m.progress);
    },
  });
  try {
    const { data } = await worker.recognize(source as unknown as Blob);
    return { text: data.text.trim(), confidence: data.confidence };
  } finally {
    await worker.terminate();
  }
}

async function extractPdf(blob: Blob, onProgress?: OcrProgress) {
  const pdfjs = await import('pdfjs-dist');
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const doc = await pdfjs.getDocument({ data: await blob.arrayBuffer() }).promise;
  const pages = Math.min(doc.numPages, MAX_PDF_PAGES);
  const parts: string[] = [];
  let usedOcr = false;
  for (let i = 1; i <= pages; i++) {
    onProgress?.(`Reading page ${i} of ${pages}`, (i - 1) / pages);
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let text = content.items.map(it => ('str' in it ? it.str : '')).join(' ').replace(/\s+\n/g, '\n').trim();
    if (text.length < 20) {
      // Probably a scanned page: render and OCR it.
      usedOcr = true;
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
      text = (await ocrImage(canvas, onProgress, `OCR page ${i} of ${pages}`)).text;
    }
    if (text) parts.push(pages > 1 ? `--- Page ${i} ---\n${text}` : text);
  }
  const note = doc.numPages > MAX_PDF_PAGES ? `\n\n[Only the first ${MAX_PDF_PAGES} of ${doc.numPages} pages were processed.]` : '';
  return { text: parts.join('\n\n') + note, usedOcr };
}

/** Returns extracted text, or throws an Error with a user-facing message. */
export async function extractText(blob: Blob, mime: string, onProgress?: OcrProgress): Promise<{ text: string; method: string; confidence?: number }> {
  if (mime === 'application/pdf') {
    const { text, usedOcr } = await extractPdf(blob, onProgress);
    if (!text.trim()) throw new Error('No readable text was found in this PDF.');
    return { text, method: usedOcr ? 'PDF + OCR (scanned pages)' : 'PDF text layer' };
  }
  if (mime === 'image/png' || mime === 'image/jpeg') {
    const { text, confidence } = await ocrImage(blob, onProgress);
    if (!text) throw new Error('No readable text was found. The image may be blurry, rotated or handwritten.');
    return { text, method: 'Tesseract OCR', confidence };
  }
  throw new Error('This file type is not supported for OCR. Supported: PDF, PNG, JPEG.');
}
