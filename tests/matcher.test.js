import { describe, expect, test } from 'vitest';
import { matchCourseEquivalent } from '@/lib/matcher';

describe('matchCourseEquivalent', () => {
  test('returns high-confidence exact match', () => {
    const result = matchCourseEquivalent('Calculus I');
    expect(result.matchedEquivalent).toBe('MATH 2413');
    expect(result.confidence).toBeGreaterThan(0.9);
    expect(result.band).toBe('green');
  });

  test('returns no match when title is unrelated', () => {
    const result = matchCourseEquivalent('World Theatre Appreciation');
    expect(result.matchedEquivalent).toBe('');
    expect(result.needsReview).toBe(true);
    expect(result.band).toBe('red');
  });
});
