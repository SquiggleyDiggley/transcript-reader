const reviewMemory = globalThis.__reviewMemory || [];
globalThis.__reviewMemory = reviewMemory;

export function saveReview(review) {
  reviewMemory.push({
    ...review,
    savedAt: new Date().toISOString(),
  });

  return reviewMemory[reviewMemory.length - 1];
}

export function getReviews() {
  return reviewMemory;
}