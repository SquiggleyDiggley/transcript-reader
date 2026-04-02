import { NextResponse } from 'next/server';
import { saveReview, getReviews } from '@/lib/reviewStore';

export async function POST(request) {
  try {
    const body = await request.json();
    const { rawCourse, confirmedEquivalent, grade, credits, reviewerNote } = body;

    if (!rawCourse || !confirmedEquivalent) {
      return NextResponse.json(
        { error: 'rawCourse and confirmedEquivalent are required' },
        { status: 400 },
      );
    }

    const saved = saveReview({
      rawCourse,
      confirmedEquivalent,
      grade: grade || null,
      credits: credits ?? null,
      reviewerNote: reviewerNote || '',
    });

    return NextResponse.json({
      message: 'Review saved successfully',
      saved,
      totalSavedReviews: getReviews().length,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid review payload' }, { status: 400 });
  }
}
