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
