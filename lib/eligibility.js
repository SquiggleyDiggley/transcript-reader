import { catalog } from '@/data/catalog';
import { prerequisites } from '@/data/prerequisites';

const PASSING_GRADES = new Set(['A', 'B', 'C', 'D', 'P']);

export function getCompletedCourses(extractedCourses) {
  const completed = extractedCourses
    .filter((course) => course.matchedEquivalent && PASSING_GRADES.has(course.grade))
    .map((course) => course.matchedEquivalent);

  return [...new Set(completed)].sort();
}

export function computeEligibility(completed) {
  const eligibleNext = [];
  const blocked = [];

  for (const course of catalog) {
    if (completed.includes(course)) continue;

  const required = prerequisites[course] || [];
    const missing = required.filter((item) => !completed.includes(item));

    if (missing.length === 0) {
      eligibleNext.push({
        course,
        reason: required.length
          ? `All prerequisites satisfied: ${required.join(', ')}`
          : 'No prerequisites required',
      });
    } else {
      blocked.push({
        course,
        missingPrerequisites: missing,
        reason: `Missing prerequisite${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`,
      });
    }
  }

  return {
    eligibleNext,
    blocked,
    remaining: catalog.filter((course) => !completed.includes(course)),
  };
}
