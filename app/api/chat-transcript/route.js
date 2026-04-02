import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/v1';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:latest';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || 'ollama';

const client = new OpenAI({
  baseURL: OLLAMA_BASE_URL,
  apiKey: OLLAMA_API_KEY,
});

export async function POST(request) {
  try {
    const body = await request.json();
    const question = (body?.question || '').trim();
    const transcript = body?.transcript || null;

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript context is required before asking questions' },
        { status: 400 },
      );
    }

    const contextPayload = JSON.stringify(transcript, null, 2);

    const response = await client.responses.create({
      model: OLLAMA_MODEL,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: [
                'You are TransferPath AI, a registrar assistant for transfer-credit advising.',
                'Answer only using the transcript context provided.',
                'If information is missing, say what is missing instead of guessing.',
                'Be concise, clear, and practical.',
              ].join(' '),
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Transcript context:\n${contextPayload}`,
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: question,
            },
          ],
        },
      ],
      store: false,
    });

    const answer = (response.output_text || '').trim();

    if (!answer) {
      return NextResponse.json(
        {
          error: 'TransferPath AI did not return an answer',
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ answer });
  } catch (error) {
    const details = error?.message || 'Unknown error';
    const isOllamaConnectionIssue = /ECONNREFUSED|fetch failed|connect|ENOTFOUND/i.test(details);

    return NextResponse.json(
      {
        error: isOllamaConnectionIssue
          ? 'Could not connect to Ollama. Ensure Ollama is running and OLLAMA_BASE_URL is correct.'
          : 'Failed to answer transcript question',
        details,
      },
      { status: 500 },
    );
  }
}
