import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { matchCourseEquivalent } from '@/lib/matcher';
import { getCompletedCourses, computeEligibility } from '@/lib/eligibility';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/v1';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || 'ollama';

const client = new OpenAI({
  baseURL: OLLAMA_BASE_URL,
  apiKey: OLLAMA_API_KEY,
});

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

    // MVP approach:
    // - For now, read file text directly.
    // - This works well for .txt and many text-based PDFs only if you already convert them upstream.
    // - This route is configured for Ollama's OpenAI-compatible endpoint.
    const fileText = await file.text();

    if (!fileText || !fileText.trim()) {
      return NextResponse.json(
        { error: 'Uploaded file is empty or could not be read as text.' },
        { status: 400 }
      );
    }

    const response = await client.responses.create({
      model: OLLAMA_MODEL,
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

    const details = error?.message || 'Unknown error';
    const isOllamaConnectionIssue =
      /ECONNREFUSED|fetch failed|connect|ENOTFOUND/i.test(details);

    return NextResponse.json(
      {
        error: 'Failed to process transcript',
        details: isOllamaConnectionIssue
          ? 'Could not connect to Ollama. Ensure Ollama is running and OLLAMA_BASE_URL is correct.'
          : details,
      },
      { status: 500 }
    );
  }
}
