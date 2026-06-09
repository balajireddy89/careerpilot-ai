const STORAGE_PREFIX = 'careerpilot_chat_';

function storageKey(profileKey) {
  return `${STORAGE_PREFIX}${profileKey || 'default'}`;
}

export function loadChatMessages(profileKey) {
  try {
    const raw = sessionStorage.getItem(storageKey(profileKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function saveChatMessages(profileKey, messages) {
  try {
    sessionStorage.setItem(storageKey(profileKey), JSON.stringify(messages));
  } catch (err) {
    console.warn('Failed to persist chat session:', err);
  }
}

export function clearChatMessages(profileKey) {
  sessionStorage.removeItem(storageKey(profileKey));
}
