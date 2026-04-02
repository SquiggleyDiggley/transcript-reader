import { describe, expect, test } from 'vitest';
import { computeEligibility } from '@/lib/eligibility';

describe('computeEligibility', () => {
  test('explains eligible courses', () => {
    const result = computeEligibility(['CSCI 1436']);
    const course = result.eligibleNext.find((item) => item.course === 'CSCI 2336');
    expect(course.reason).toContain('All prerequisites satisfied');
  });

  test('explains blocked courses', () => {
    const result = computeEligibility([]);
    const course = result.blocked.find((item) => item.course === 'CSCI 3333');
    expect(course.reason).toContain('Missing prerequisite');
  });
});
