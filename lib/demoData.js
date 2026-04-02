export const demoTranscriptData = {
  extractedCourses: [
    {
      rawCourse: 'Intro to Programming',
      grade: 'A',
      credits: 3,
      matchedEquivalent: 'CSCI 1436',
      confidence: 0.99,
      needsReview: false,
      matchReason: 'Exact title match with "intro to programming"',
      confidenceBand: 'green',
    },
    {
      rawCourse: 'Calculus I',
      grade: 'B',
      credits: 4,
      matchedEquivalent: 'MATH 2413',
      confidence: 0.99,
      needsReview: false,
      matchReason: 'Exact title match with "calculus i"',
      confidenceBand: 'green',
    },
    {
      rawCourse: 'English Composition I',
      grade: 'A',
      credits: 3,
      matchedEquivalent: 'ENGL 1301',
      confidence: 0.96,
      needsReview: false,
      matchReason: 'Exact title match with "english composition i"',
      confidenceBand: 'green',
    },
    {
      rawCourse: 'Programming Fundamentals II',
      grade: 'B',
      credits: 3,
      matchedEquivalent: '',
      confidence: 0.42,
      needsReview: true,
      matchReason: 'No reliable equivalency match found',
      confidenceBand: 'red',
    },
  ],
  completed: ['CSCI 1436', 'ENGL 1301', 'MATH 2413'],
  eligibleNext: [
    {
      course: 'CSCI 2336',
      reason: 'All prerequisites satisfied: CSCI 1436',
    },
    {
      course: 'MATH 2414',
      reason: 'All prerequisites satisfied: MATH 2413',
    },
  ],
  blocked: [
    {
      course: 'CSCI 3333',
      missingPrerequisites: ['CSCI 2336'],
      reason: 'Missing prerequisite: CSCI 2336',
    },
  ],
  remaining: ['CSCI 2336', 'CSCI 3333', 'MATH 2414'],
};
