import { matchCourseEquivalent } from '@/lib/matcher';

export function parseCoursesFromText(text) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const parts = line.split('|').map((part) => part.trim());
    const rawCourse = parts[0] || '';
    const grade = parts[1] ? parts[1].toUpperCase() : '';
    const credits = parts[2] ? Number(parts[2]) : null;
    const match = matchCourseEquivalent(rawCourse);

    return {
      rawCourse,
      grade,
      credits,
      matchedEquivalent: match.matchedEquivalent,
      confidence: match.confidence,
      needsReview: match.needsReview,
      matchReason: match.reason,
      confidenceBand: match.band,
    };
  });
}
