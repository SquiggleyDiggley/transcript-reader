import { getOpenAIClient } from '@/lib/openai';

export async function extractTranscriptText({ fileText }) {
  const openai = getOpenAIClient();
  const response = await openai.responses.create({
    model: 'gpt-5.4-mini',
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: 'Extract transcript rows into valid JSON matching the provided schema.',
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
        schema: {
          type: 'object',
          properties: {
            studentName: { type: 'string' },
            institution: { type: 'string' },
            courses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  rawCourse: { type: 'string' },
                  grade: { type: 'string' },
                  credits: { type: 'number' },
                  term: { type: 'string' },
                },
                required: ['rawCourse'],
                additionalProperties: false,
              },
            },
          },
          required: ['courses'],
          additionalProperties: false,
        },
      },
    },
  });

  return JSON.parse(response.output_text);
}
