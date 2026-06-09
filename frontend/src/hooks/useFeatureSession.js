import { useState, useEffect, useCallback } from 'react';

const PREFIX = 'careerpilot_session_';

export function getProfileKey(profile) {
  return profile?.email || profile?.name || 'default';
}

export function loadFeatureSession(featureId, profileKey) {
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${featureId}_${profileKey}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveFeatureSession(featureId, profileKey, data) {
  try {
    sessionStorage.setItem(`${PREFIX}${featureId}_${profileKey}`, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to persist feature session:', err);
  }
}

export function clearFeatureSession(featureId, profileKey) {
  sessionStorage.removeItem(`${PREFIX}${featureId}_${profileKey}`);
}

export function useFeatureSession(featureId, profileKey, defaultState) {
  const [state, setStateInternal] = useState(() => ({
    ...defaultState,
    ...(loadFeatureSession(featureId, profileKey) || {}),
  }));

  useEffect(() => {
    saveFeatureSession(featureId, profileKey, state);
  }, [featureId, profileKey, state]);

  const setState = useCallback((updater) => {
    setStateInternal((prev) => (typeof updater === 'function' ? updater(prev) : updater));
  }, []);

  const resetSession = useCallback(() => {
    clearFeatureSession(featureId, profileKey);
    setStateInternal({ ...defaultState });
  }, [featureId, profileKey, defaultState]);

  return [state, setState, resetSession];
}
