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

export async function extractTextFromFile(file) {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'txt') {
    return (await file.text()).slice(0, 15000);
  }

  if (ext === 'pdf') {
    const buffer = await file.arrayBuffer();
    const raw = new TextDecoder('latin1').decode(new Uint8Array(buffer));
    const chunks = raw.match(/\((?:\\.|[^\\)])*?\)/g) || [];
    const text = chunks
      .map((chunk) => chunk.slice(1, -1).replace(/\\n/g, '\n').replace(/\\r/g, ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length > 80) return text.slice(0, 15000);
  }

  return `[Resume file: ${file.name}. Text extraction limited for .${ext || 'unknown'} — use filename, profile skills, and any readable fragments.]`;
}
