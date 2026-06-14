export function parseAIJson(text, fallback = null) {
  if (!text) return fallback;

  try {
    const trimmed = text.trim();
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    const candidate = (fenced?.[1] || trimmed).trim();
    return JSON.parse(candidate);
  } catch {
    try {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start >= 0 && end > start) {
        return JSON.parse(text.slice(start, end + 1));
      }
      const arrStart = text.indexOf('[');
      const arrEnd = text.lastIndexOf(']');
      if (arrStart >= 0 && arrEnd > arrStart) {
        return JSON.parse(text.slice(arrStart, arrEnd + 1));
      }
    } catch {
      return fallback;
    }
  }

  return fallback;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/** Match AI answer letter or text to one of the four options */
export function normalizeMcqAnswer(options, answer) {
  if (!Array.isArray(options) || options.length === 0) return answer;
  const opts = options.map((o) => String(o).trim());
  const ans = String(answer ?? '').trim();
  const exact = opts.find((o) => o === ans);
  if (exact) return exact;
  const ci = opts.find((o) => o.toLowerCase() === ans.toLowerCase());
  if (ci) return ci;
  const letter = ans.toUpperCase();
  if (/^[A-D]$/.test(letter)) {
    const idx = letter.charCodeAt(0) - 65;
    if (opts[idx]) return opts[idx];
  }
  const partial = opts.find((o) => o.toLowerCase().includes(ans.toLowerCase()) || ans.toLowerCase().includes(o.toLowerCase()));
  return partial || opts[0];
}

export function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function loadScript(src, integrity = null) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    if (integrity) {
      script.integrity = integrity;
      script.crossOrigin = 'anonymous';
    }
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

export async function extractTextFromFile(file) {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'txt') {
    return (await file.text()).slice(0, 15000);
  }

  if (ext === 'pdf') {
    try {
      const buffer = await file.arrayBuffer();
      // Pinned CDN version with SRI verification
      await loadScript(
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
        'sha384-/1qUCSGwTur9vjf/z9lmu/eCUYbpOTgSjmpbMQZ1/CtX2v/WcAIKqRv+U1DUCG6e'
      );

      const pdfjsLib = window.pdfjsLib;
      // Configure worker securely using pinned matching version
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
      const pdf = await loadingTask.promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      if (fullText.trim().length > 0) {
        return fullText.slice(0, 15000);
      }
    } catch (err) {
      console.error('PDF.js text extraction failed:', err);
    }
  }

  if (ext === 'docx') {
    try {
      const buffer = await file.arrayBuffer();
      // Pinned CDN version with SRI verification
      await loadScript(
        'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js',
        'sha384-nFoSjZIoH3CCp8W639jJyQkuPHinJ2NHe7on1xvlUA7SuGfJAfvMldrsoAVm6ECz'
      );

      const mammoth = window.mammoth;
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      if (result && result.value && result.value.trim().length > 0) {
        return result.value.slice(0, 15000);
      }
    } catch (err) {
      console.error('Mammoth docx text extraction failed:', err);
    }
  }

  return `[Resume file: ${file.name}. Text extraction limited for .${ext || 'unknown'} — use filename, profile skills, and any readable fragments.]`;
}
