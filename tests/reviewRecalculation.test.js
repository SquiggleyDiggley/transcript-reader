import { describe, expect, test } from 'vitest';
import { applyConfirmedReview } from '@/lib/reviewRecalculation';

function buildBaseState() {
  return {
    extractedCourses: [
      {
        rawCourse: 'Intro to Programming',
        grade: 'A',
        credits: 3,
        matchedEquivalent: '',
        confidence: 0.7,
        needsReview: true,
        matchReason: 'Partial keyword overlap',
        confidenceBand: 'yellow',
      },
      {
        rawCourse: 'Calculus I',
        grade: 'B',
        credits: 4,
        matchedEquivalent: 'MATH 2413',
        confidence: 0.99,
        needsReview: false,
        matchReason: 'Exact title match',
        confidenceBand: 'green',
      },
    ],
    completed: ['MATH 2413'],
    eligibleNext: [],
    blocked: [],
    remaining: [],
  };
}

describe('applyConfirmedReview', () => {
  test('updates the matching row and recomputes eligibility fields', () => {
    const state = buildBaseState();

    const updated = applyConfirmedReview(state, {
      rawCourse: 'Intro to Programming',
      confirmedEquivalent: 'CSCI 1436',
      reviewerNote: 'Verified against syllabus',
    });

    const target = updated.extractedCourses.find((c) => c.rawCourse === 'Intro to Programming');
    expect(target.matchedEquivalent).toBe('CSCI 1436');
    expect(target.needsReview).toBe(false);
    expect(target.confidenceBand).toBe('green');
    expect(target.matchReason).toContain('Verified against syllabus');

    expect(updated.completed).toContain('CSCI 1436');

    const csci2336 = updated.eligibleNext.find((item) => item.course === 'CSCI 2336');
    expect(csci2336).toBeTruthy();
  });

  test('uses default confirmation reason when reviewer note is missing', () => {
    const state = buildBaseState();

    const updated = applyConfirmedReview(state, {
      rawCourse: 'Intro to Programming',
      confirmedEquivalent: 'CSCI 1436',
      reviewerNote: '',
    });

    const target = updated.extractedCourses.find((c) => c.rawCourse === 'Intro to Programming');
    expect(target.matchReason).toBe('Registrar confirmed match.');
  });
});
