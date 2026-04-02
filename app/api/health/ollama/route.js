import { NextResponse } from 'next/server';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/v1';

function getTagsUrl() {
  const normalized = OLLAMA_BASE_URL.replace(/\/$/, '');
  const root = normalized.replace(/\/v1$/, '');
  return `${root}/api/tags`;
}

export async function GET() {
  const tagsUrl = getTagsUrl();

  try {
    const response = await fetch(tagsUrl, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          status: 'degraded',
          connected: false,
          message: `Ollama responded with HTTP ${response.status}`,
          baseUrl: OLLAMA_BASE_URL,
        },
        { status: 200 },
      );
    }

    const payload = await response.json();
    const models = Array.isArray(payload?.models) ? payload.models : [];

    return NextResponse.json({
      status: 'ok',
      connected: true,
      modelCount: models.length,
      models: models.map((m) => m?.name).filter(Boolean),
      baseUrl: OLLAMA_BASE_URL,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'down',
        connected: false,
        message: error?.message || 'Unable to reach Ollama',
        baseUrl: OLLAMA_BASE_URL,
      },
      { status: 200 },
    );
  }
}
