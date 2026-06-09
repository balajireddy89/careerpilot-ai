/**
 * XP / quiz reward tracking — prevents farming points by resetting quizzes.
 * Stored in profile.quizRewards (synced to Supabase).
 */

export function canEarnQuizXp(profile, quizKey) {
  return !profile.quizRewards?.[quizKey]?.xpAwarded;
}

export function recordQuizCompletion(profile, quizKey, scorePercent, baseXp = 100) {
  const rewards = { ...(profile.quizRewards || {}) };
  const prev = rewards[quizKey];
  const passed = scorePercent >= 70;
  let xpEarned = 0;

  if (passed && !prev?.xpAwarded) {
    xpEarned = scorePercent >= 90 ? baseXp + 50 : baseXp;
    rewards[quizKey] = {
      bestScore: scorePercent,
      xpAwarded: true,
      completedAt: new Date().toISOString(),
    };
  } else {
    rewards[quizKey] = {
      bestScore: Math.max(prev?.bestScore ?? 0, scorePercent),
      xpAwarded: prev?.xpAwarded ?? false,
      completedAt: prev?.completedAt,
    };
  }

  return {
    profile: {
      ...profile,
      quizRewards: rewards,
      points: profile.points + xpEarned,
    },
    xpEarned,
    alreadyRewarded: Boolean(prev?.xpAwarded),
  };
}

export function canEarnCodingXp(profile, challengeKey) {
  return !profile.codingRewards?.[challengeKey];
}

export function recordCodingSolve(profile, challengeKey, xp = 200) {
  const codingRewards = { ...(profile.codingRewards || {}) };
  if (codingRewards[challengeKey]) {
    return { profile, xpEarned: 0 };
  }
  codingRewards[challengeKey] = { solvedAt: new Date().toISOString() };
  return {
    profile: {
      ...profile,
      codingRewards,
      points: profile.points + xp,
    },
    xpEarned: xp,
  };
}
