'use client';

import { useEffect, useMemo, useState } from 'react';
import ReviewTable from '@/components/ReviewTable';
import { catalog } from '@/data/catalog';
import { courseDetails } from '@/data/courseDetails';
import { demoTranscriptData } from '@/lib/demoData';

export default function HomePage() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: 'I am TransferPath AI. Upload a transcript or load demo mode, then ask me questions.',
    },
  ]);
  const [ollamaStatus, setOllamaStatus] = useState({
    loading: true,
    connected: false,
    message: 'Checking Ollama connection...',
  });

  useEffect(() => {
    checkOllamaHealth();
  }, []);

  async function checkOllamaHealth() {
    setOllamaStatus((current) => ({ ...current, loading: true }));

    try {
      const response = await fetch('/api/health/ollama', { cache: 'no-store' });
      const result = await response.json();

      if (!result.connected) {
        setOllamaStatus({
          loading: false,
          connected: false,
          message: result.message || 'Ollama is not reachable',
        });
        return;
      }

      const modelLabel = result.models?.length
        ? 'Connected (TransferPath AI)'
        : 'Connected';

      setOllamaStatus({
        loading: false,
        connected: true,
        message: modelLabel,
      });
    } catch (err) {
      setOllamaStatus({
        loading: false,
        connected: false,
        message: err.message || 'Failed to check Ollama status',
      });
    }
  }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [demoMode, setDemoMode] = useState(false);

  const stats = useMemo(() => {
    if (!data) return null;

    const total = data.extractedCourses.length;
    const confirmed = data.extractedCourses.filter(
      (course) => !course.needsReview && course.matchedEquivalent,
    ).length;
    const needsReview = data.extractedCourses.filter((course) => course.needsReview).length;
    const eligible = data.eligibleNext.length;

    return { total, confirmed, needsReview, eligible };
  }, [data]);

  async function handleUpload() {
    if (!file) return;

    setLoading(true);
    setError('');
    setReviewMessage('');
    setDemoMode(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-transcript', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setData(result);
      setChatError('');
      setChatMessages([
        {
          role: 'assistant',
          text: 'Transcript processed. Ask me about eligibility, missing prerequisites, or course equivalencies.',
        },
      ]);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function handleLoadDemo() {
    setError('');
    setReviewMessage('');
    setDemoMode(true);
    setData(demoTranscriptData);
    setChatError('');
    setChatMessages([
      {
        role: 'assistant',
        text: 'Demo transcript loaded. Ask me anything about this student\'s transfer path.',
      },
    ]);
  }

  function buildTranscriptContext(payload) {
    if (!payload) return null;

    return {
      studentName: payload.studentName || '',
      institution: payload.institution || '',
      completed: payload.completed || [],
      eligibleNext: payload.eligibleNext || [],
      blocked: payload.blocked || [],
      extractedCourses: (payload.extractedCourses || []).slice(0, 50),
      extractionSource: payload.extractionSource || 'unknown',
    };
  }

  async function handleAskQuestion() {
    const question = chatInput.trim();

    if (!question || !data || chatLoading) return;

    const nextMessages = [...chatMessages, { role: 'user', text: question }];
    setChatMessages(nextMessages);
    setChatInput('');
    setChatError('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/chat-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          transcript: buildTranscriptContext(data),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get answer');
      }

      setChatMessages((current) => [...current, { role: 'assistant', text: result.answer }]);
    } catch (err) {
      setChatError(err.message || 'Unable to answer question right now');
      setChatMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: 'I could not answer that right now. Please try again.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  async function handleSaveReview(payload) {
    setReviewMessage('');

    const response = await fetch('/api/review-course', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to save review');
    }

    setReviewMessage(`Saved review for ${payload.rawCourse}.`);

    setData((current) => {
      if (!current) return current;

      const updatedExtractedCourses = current.extractedCourses.map((course) => {
        if (course.rawCourse !== payload.rawCourse) return course;

        return {
          ...course,
          matchedEquivalent: payload.confirmedEquivalent,
          needsReview: false,
          confidence: 0.99,
          confidenceBand: 'green',
          matchReason: payload.reviewerNote
            ? `Registrar confirmed match. Note: ${payload.reviewerNote}`
            : 'Registrar confirmed match.',
        };
      });

      const passingGrades = new Set(['A', 'B', 'C', 'D', 'P']);
      const completed = [
        ...new Set(
          updatedExtractedCourses
            .filter((course) => course.matchedEquivalent && passingGrades.has(course.grade))
            .map((course) => course.matchedEquivalent),
        ),
      ].sort();

      const prerequisiteMap = {
        'CSCI 2336': ['CSCI 1436'],
        'CSCI 3333': ['CSCI 2336'],
        'MATH 2414': ['MATH 2413'],
      };

      const eligibleNext = [];
      const blocked = [];

      for (const course of catalog) {
        if (completed.includes(course)) continue;

        const required = prerequisiteMap[course] || [];
        const missing = required.filter((item) => !completed.includes(item));

        if (missing.length === 0) {
          eligibleNext.push({
            course,
            reason: required.length
              ? `All prerequisites satisfied: ${required.join(', ')}`
              : 'No prerequisites required',
          });
        } else {
          blocked.push({
            course,
            missingPrerequisites: missing,
            reason: `Missing prerequisite${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`,
          });
        }
      }

      return {
        ...current,
        extractedCourses: updatedExtractedCourses,
        completed,
        eligibleNext,
        blocked,
        remaining: catalog.filter((course) => !completed.includes(course)),
      };
    });
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroLeft}>
          <div style={styles.brandRow}>
            <div style={styles.logo}>TP</div>
            <div>
              <h1 style={styles.title}>TransferPath</h1>
              <p style={styles.tagline}>From transcript to registration, instantly.</p>
            </div>
          </div>

          <p style={styles.description}>
            Upload a transfer transcript, review extracted courses, confirm equivalencies, and see
            what the student can register for next.
          </p>

          <div style={styles.statusRow}>
            <span
              style={
                ollamaStatus.connected ? styles.statusBadgeConnected : styles.statusBadgeDisconnected
              }
            >
              {ollamaStatus.loading ? 'Checking Ollama…' : ollamaStatus.message}
            </span>
            <button onClick={checkOllamaHealth} style={styles.statusButton}>
              Refresh Status
            </button>
          </div>

          <div style={styles.buttonRow}>
            <input
              type="file"
              accept=".txt,.pdf"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              style={styles.fileInput}
            />
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              style={styles.primaryButton}
            >
              {loading ? 'Processing...' : 'Upload Transcript'}
            </button>
            <button onClick={handleLoadDemo} style={styles.secondaryButton}>
              Load Demo Mode
            </button>
          </div>

          {demoMode ? (
            <div style={styles.noteBox}>
              <strong>Demo story:</strong> Extract rows, flag uncertain matches, confirm a course,
              and watch eligibility update live.
            </div>
          ) : null}

          {error ? <p style={styles.error}>{error}</p> : null}
          {reviewMessage ? <p style={styles.success}>{reviewMessage}</p> : null}
        </div>

        <div style={styles.heroRight}>
          <div style={styles.previewCard}>
            <p style={styles.previewLabel}>Why it matters</p>
            <ul style={styles.previewList}>
              <li>Reduces manual transcript entry</li>
              <li>Improves equivalency review accuracy</li>
              <li>Explains why a course is eligible or blocked</li>
              <li>Supports transfer registration decisions faster</li>
            </ul>
          </div>
        </div>
      </section>

      {stats ? (
        <section style={styles.statsRow}>
          <StatCard label="Rows Extracted" value={stats.total} />
          <StatCard label="Auto-Ready Matches" value={stats.confirmed} />
          <StatCard label="Needs Review" value={stats.needsReview} />
          <StatCard label="Eligible Courses" value={stats.eligible} />
        </section>
      ) : null}

      {demoMode ? (
        <section style={styles.demoBanner}>
          <strong>Demo Mode Active:</strong> This screen is using preloaded transcript data so you
          can present the full workflow instantly.
        </section>
      ) : null}

      {data ? (
        <>
          <ReviewTable
            extractedCourses={data.extractedCourses}
            catalog={catalog}
            onSaveReview={handleSaveReview}
          />

          <section style={styles.grid}>
            <Panel title="Completed Courses">
              <ul style={styles.list}>
                {data.completed.map((course) => (
                  <li key={course}>
                    <strong>{course}</strong> — {courseDetails[course]?.title || 'Course'}
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Eligible Next">
              <ul style={styles.list}>
                {data.eligibleNext.map((item) => (
                  <li key={item.course}>
                    <strong>{item.course}</strong> — {courseDetails[item.course]?.title || 'Course'}
                    <div style={styles.reason}>{item.reason}</div>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Blocked Courses">
              <ul style={styles.list}>
                {data.blocked.map((item) => (
                  <li key={item.course}>
                    <strong>{item.course}</strong> — {courseDetails[item.course]?.title || 'Course'}
                    <div style={styles.reason}>{item.reason}</div>
                  </li>
                ))}
              </ul>
            </Panel>
          </section>

          <section style={styles.chatSection}>
            <h3 style={styles.chatTitle}>Ask TransferPath AI</h3>
            <div style={styles.chatMessages}>
              {chatMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  style={message.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAssistant}
                >
                  {message.text}
                </div>
              ))}
            </div>

            <div style={styles.chatInputRow}>
              <input
                type="text"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAskQuestion();
                  }
                }}
                placeholder="Ask about requirements, eligibility, or transfer credit..."
                style={styles.chatInput}
              />
              <button
                onClick={handleAskQuestion}
                disabled={!chatInput.trim() || chatLoading}
                style={styles.chatSendButton}
              >
                {chatLoading ? 'Thinking...' : 'Ask'}
              </button>
            </div>

            {chatError ? <p style={styles.error}>{chatError}</p> : null}
          </section>
        </>
      ) : null}
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div style={styles.panel}>
      <h3 style={styles.panelTitle}>{title}</h3>
      {children}
    </div>
  );
}

const styles = {
  page: {
    padding: '2rem',
    maxWidth: '1280px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
    color: '#111827',
    background: '#f8fafc',
    minHeight: '100vh',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: '1.8fr 1fr',
    gap: '1.5rem',
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '20px',
    padding: '2rem',
    boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)',
  },
  heroLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  heroRight: {
    display: 'flex',
    alignItems: 'stretch',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  logo: {
    width: '64px',
    height: '64px',
    borderRadius: '18px',
    background: '#1d4ed8',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: '1.25rem',
  },
  title: {
    margin: 0,
    fontSize: '2.25rem',
    fontWeight: 800,
  },
  tagline: {
    margin: '0.35rem 0 0 0',
    color: '#475569',
    fontSize: '1.05rem',
  },
  description: {
    margin: 0,
    color: '#334155',
    fontSize: '1rem',
    maxWidth: '720px',
    lineHeight: 1.6,
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  statusBadgeConnected: {
    background: '#dcfce7',
    color: '#166534',
    border: '1px solid #86efac',
    borderRadius: '999px',
    padding: '0.35rem 0.75rem',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  statusBadgeDisconnected: {
    background: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fca5a5',
    borderRadius: '999px',
    padding: '0.35rem 0.75rem',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  statusButton: {
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#0f172a',
    borderRadius: '8px',
    padding: '0.4rem 0.65rem',
    cursor: 'pointer',
    fontWeight: 600,
  },
  buttonRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  fileInput: {
    maxWidth: '260px',
  },
  primaryButton: {
    background: '#1d4ed8',
    color: '#fff',
    border: 'none',
    padding: '0.8rem 1rem',
    borderRadius: '10px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  secondaryButton: {
    background: '#e2e8f0',
    color: '#0f172a',
    border: 'none',
    padding: '0.8rem 1rem',
    borderRadius: '10px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  noteBox: {
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    color: '#1e3a8a',
    padding: '0.9rem 1rem',
    borderRadius: '12px',
  },
  previewCard: {
    background: '#0f172a',
    color: '#ffffff',
    borderRadius: '18px',
    padding: '1.5rem',
    width: '100%',
  },
  previewLabel: {
    marginTop: 0,
    marginBottom: '0.75rem',
    color: '#93c5fd',
    fontWeight: 700,
  },
  previewList: {
    margin: 0,
    paddingLeft: '1.2rem',
    lineHeight: 1.8,
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  statCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '1rem 1.1rem',
  },
  statLabel: {
    color: '#64748b',
    fontSize: '0.9rem',
  },
  statValue: {
    marginTop: '0.3rem',
    fontSize: '1.8rem',
    fontWeight: 800,
  },
  demoBanner: {
    marginTop: '1.25rem',
    background: '#ecfccb',
    border: '1px solid #bef264',
    color: '#365314',
    padding: '0.9rem 1rem',
    borderRadius: '12px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  chatSection: {
    marginTop: '1.5rem',
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '1rem',
  },
  chatTitle: {
    marginTop: 0,
    marginBottom: '0.75rem',
  },
  chatMessages: {
    maxHeight: '320px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    padding: '0.25rem 0',
  },
  chatBubbleAssistant: {
    alignSelf: 'flex-start',
    background: '#eff6ff',
    color: '#1e3a8a',
    border: '1px solid #bfdbfe',
    borderRadius: '12px',
    padding: '0.65rem 0.8rem',
    maxWidth: '85%',
    whiteSpace: 'pre-wrap',
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    background: '#dbeafe',
    color: '#0f172a',
    border: '1px solid #93c5fd',
    borderRadius: '12px',
    padding: '0.65rem 0.8rem',
    maxWidth: '85%',
    whiteSpace: 'pre-wrap',
  },
  chatInputRow: {
    marginTop: '0.8rem',
    display: 'flex',
    gap: '0.6rem',
  },
  chatInput: {
    flex: 1,
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '0.65rem 0.75rem',
    fontSize: '0.95rem',
  },
  chatSendButton: {
    background: '#1d4ed8',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '0.65rem 1rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  panel: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '1rem',
  },
  panelTitle: {
    marginTop: 0,
    marginBottom: '0.75rem',
  },
  list: {
    margin: 0,
    paddingLeft: '1.2rem',
    lineHeight: 1.7,
  },
  reason: {
    color: '#475569',
    fontSize: '0.92rem',
    marginTop: '0.2rem',
  },
  emptyState: {
    marginTop: '1.5rem',
    background: '#ffffff',
    border: '1px dashed #cbd5e1',
    borderRadius: '16px',
    padding: '1.5rem',
  },
  error: {
    color: '#b91c1c',
    margin: 0,
  },
  success: {
    color: '#166534',
    margin: 0,
  },
};
