import { equivalencies } from '@/data/equivalencies';

function normalize(text = '') {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

function scoreCandidate(rawCourse, entry) {
  const normalizedRaw = normalize(rawCourse);
  const mainName = normalize(entry.externalName);
  const aliases = (entry.aliases || []).map(normalize);

  if (normalizedRaw === mainName) {
    return { score: 0.99, reason: `Exact title match with "${entry.externalName}"` };
  }

  if (aliases.includes(normalizedRaw)) {
    return { score: 0.96, reason: `Exact alias match for ${entry.internalCode}` };
  }

  if (normalizedRaw.includes(mainName)) {
    return {
      score: 0.9,
      reason: `Transcript title contains known course title "${entry.externalName}"`,
    };
  }

  const aliasHit = aliases.find((alias) => normalizedRaw.includes(alias));
  if (aliasHit) {
    return {
      score: 0.86,
      reason: `Transcript title contains known alias "${aliasHit}"`,
    };
  }

  return null;
}

export function matchCourseEquivalent(rawCourse) {
  const candidates = equivalencies
    .map((entry) => {
      const scored = scoreCandidate(rawCourse, entry);
      if (!scored) return null;
      return {
        internalCode: entry.internalCode,
        confidence: scored.score,
        reason: scored.reason,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.confidence - a.confidence);

  if (!candidates.length) {
    return {
      matchedEquivalent: '',
      confidence: 0,
      needsReview: true,
      reason: 'No reliable equivalency match found',
      band: 'red',
    };
  }

  const best = candidates[0];

  return {
    matchedEquivalent: best.internalCode,
    confidence: best.confidence,
    needsReview: best.confidence < 0.95,
    reason: best.reason,
    band: best.confidence >= 0.95 ? 'green' : best.confidence >= 0.8 ? 'yellow' : 'red',
  };
}
