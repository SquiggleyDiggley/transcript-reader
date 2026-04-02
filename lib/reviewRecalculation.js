import { computeEligibility, getCompletedCourses } from '@/lib/eligibility';

export function applyConfirmedReview(current, payload) {
  if (!current) return current;

  const updatedExtractedCourses = current.extractedCourses.map((course) => {
    if (course.rawCourse !== payload.rawCourse) {
      return course;
    }

    return {
      ...course,
      matchedEquivalent: payload.confirmedEquivalent,
      needsReview: false,
      confidence: Math.max(Number(course.confidence || 0), 0.99),
      confidenceBand: 'green',
      matchReason: payload.reviewerNote
        ? `Registrar confirmed match. Note: ${payload.reviewerNote}`
        : 'Registrar confirmed match.',
    };
  });

  const completed = getCompletedCourses(updatedExtractedCourses);
  const eligibility = computeEligibility(completed);

  return {
    ...current,
    extractedCourses: updatedExtractedCourses,
    completed,
    eligibleNext: eligibility.eligibleNext,
    blocked: eligibility.blocked,
    remaining: eligibility.remaining,
  };
}