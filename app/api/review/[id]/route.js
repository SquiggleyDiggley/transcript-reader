import { NextResponse } from 'next/server';
import { getTranscriptSession } from '@/lib/transcriptStore';

export async function GET(_request, context) {
  const params = await context.params;
  const id = params?.id;
  const session = getTranscriptSession(id);

  if (!session) {
    return NextResponse.json({ error: 'Review session not found or expired' }, { status: 404 });
  }

  return NextResponse.json({
    transcriptId: id,
    transcript: session.transcript,
    uploadedFile: session.uploadedFile || null,
    transcriptText: session.transcriptText || '',
    createdAt: session.createdAt,
    retrieval: session.rag
      ? {
          chunkCount: session.rag.chunks?.length || 0,
          embeddedChunkCount: (session.rag.chunks || []).filter((chunk) => Array.isArray(chunk.embedding)).length,
          embedModel: session.rag.embedModel,
        }
      : null,
  });
}
