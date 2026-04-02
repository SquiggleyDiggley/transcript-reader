// Simple in-memory session store for transcript review sessions.
// This is intentionally lightweight and suitable for local development/testing.

const sessions = new Map();

export function createTranscriptSession(id, data = {}) {
  const now = Date.now();
  const session = {
    createdAt: now,
    transcript: data.transcript || null,
    uploadedFile: data.uploadedFile || null,
    transcriptText: data.transcriptText || '',
    rag: data.rag || null,
    ...data,
  };
  sessions.set(String(id), session);
  return session;
}

export function getTranscriptSession(id) {
  if (!id) return null;
  return sessions.get(String(id)) || null;
}

export function setTranscriptSession(id, data) {
  const existing = getTranscriptSession(id) || {};
  const updated = { ...existing, ...data };
  sessions.set(String(id), updated);
  return updated;
}

export function deleteTranscriptSession(id) {
  return sessions.delete(String(id));
}

export function clearSessions() {
  sessions.clear();
}

export default { createTranscriptSession, getTranscriptSession, setTranscriptSession, deleteTranscriptSession, clearSessions };
