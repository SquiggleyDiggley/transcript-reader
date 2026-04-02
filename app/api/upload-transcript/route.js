import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { matchCourseEquivalent } from '@/lib/matcher';
import { getCompletedCourses, computeEligibility } from '@/lib/eligibility';

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const transcriptSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    studentName: { type: 'string' },
    institution: { type: 'string' },
    courses: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          rawCourse: { type: 'string' },
          grade: { type: 'string' },
          credits: { type: 'number' },
          term: { type: 'string' },
        },
        required: ['rawCourse'],
      },
    },
  },
  required: ['courses'],
};

function decorateCourses(courses = []) {
  return courses.map((course) => {
    const match = matchCourseEquivalent(course.rawCourse || '');

    return {
      rawCourse: course.rawCourse || '',
      grade: course.grade || '',
      credits: Number.isFinite(course.credits) ? course.credits : null,
      term: course.term || '',
      matchedEquivalent: match.matchedEquivalent || '',
      confidence: match.confidence || 0,
      needsReview: Boolean(match.needsReview),
      matchReason: match.reason || 'No explanation available',
      confidenceBand: match.band || 'red',
    };
  });
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!client) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured' },
        { status: 500 },
      );
    }

    // MVP approach:
    // - For now, read file text directly.
    // - This works well for .txt and many text-based PDFs only if you already convert them upstream.
    // - Later, you can switch to OpenAI file input or a PDF text extraction step.
    const fileText = await file.text();

    if (!fileText || !fileText.trim()) {
      return NextResponse.json(
        { error: 'Uploaded file is empty or could not be read as text.' },
        { status: 400 }
      );
    }

    const response = await client.responses.create({
      model: 'gpt-5.4-mini',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: [
                'You extract transcript data for a university transfer-credit workflow.',
                'Return only structured data matching the schema.',
                'Extract each course row with raw course title, grade, credits, and term when available.',
                'Do not invent courses or values not present in the transcript.',
              ].join(' '),
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: fileText,
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'transcript_extraction',
          schema: transcriptSchema,
        },
      },
      store: false,
    });

    const parsed = JSON.parse(response.output_text);
    const extractedCourses = decorateCourses(parsed.courses || []);
    const completed = getCompletedCourses(extractedCourses);
    const eligibility = computeEligibility(completed);

    return NextResponse.json({
      studentName: parsed.studentName || '',
      institution: parsed.institution || '',
      extractedCourses,
      completed,
      eligibleNext: eligibility.eligibleNext,
      blocked: eligibility.blocked,
      remaining: eligibility.remaining,
    });
  } catch (error) {
    console.error('upload-transcript error:', error);

    return NextResponse.json(
      {
        error: 'Failed to process transcript',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
