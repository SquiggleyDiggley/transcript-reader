import { getOpenAIClient } from '@/lib/openai';

export async function analyzeAmbiguousRow({ rawCourse, candidates }) {
  const openai = getOpenAIClient();
  const response = await openai.responses.create({
    model: 'gpt-5.4',
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: 'Choose the best internal course match and explain the reasoning briefly.',
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: JSON.stringify({ rawCourse, candidates }),
          },
        ],
      },
    ],
  });

  return response.output_text;
}
