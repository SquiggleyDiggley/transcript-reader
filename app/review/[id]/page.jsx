'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReviewTable from '@/components/ReviewTable';
import SummaryCards from '@/components/SummaryCards';
import TranscriptViewer from '@/components/TranscriptViewer';
import EligibilityPanel from '@/components/EligibilityPanel';
import TranscriptChatWidget from '@/components/TranscriptChatWidget';
import { catalog } from '@/data/catalog';
import { courseDetails } from '@/data/courseDetails';
import { applyConfirmedReview } from '@/lib/reviewRecalculation';

const operatingModelSteps = [
  'Show the source',
  'Show the extraction',
  'Highlight uncertainty',
  'Let humans decide',
  'Explain the outcome',
];

function statusLabel(data) {
  if (!data) return 'Loading';
  const reviewCount = (data.extractedCourses || []).filter((row) => row.needsReview).length;
  if (reviewCount > 0) return `${reviewCount} Exceptions`;
  return 'Ready';
}

export default function ReviewWorkspacePage() {
  const params = useParams();
  const router = useRouter();

  const reviewId = typeof params?.id === 'string' ? params.id : '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [selectedRow, setSelectedRow] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [transcriptText, setTranscriptText] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);

  useEffect(() => {
    async function loadReviewSession() {
      if (!reviewId) return;

      setLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/review/${reviewId}`, { cache: 'no-store' });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load review session');
        }

        setReviewData({
          transcriptId: result.transcriptId,
          ...(result.transcript || {}),
        });
        setTranscriptText(result.transcriptText || '');
        setUploadedFile(result.uploadedFile || null);
      } catch (err) {
        setError(err.message || 'Unable to load transcript review workspace');
      } finally {
        setLoading(false);
      }
    }

    loadReviewSession();
  }, [reviewId]);

  const stats = useMemo(() => {
    if (!reviewData) return null;

    const extracted = reviewData.extractedCourses?.length || 0;
    const needsReview = (reviewData.extractedCourses || []).filter((row) => row.needsReview).length;
    const eligible = reviewData.eligibleNext?.length || 0;
    const blocked = reviewData.blocked?.length || 0;

    return { extracted, needsReview, eligible, blocked };
  }, [reviewData]);

  const chatTranscriptContext = useMemo(() => {
    if (!reviewData) return null;
    return {
      studentName: reviewData.studentName || '',
      institution: reviewData.institution || '',
      completed: reviewData.completed || [],
      eligibleNext: reviewData.eligibleNext || [],
      blocked: reviewData.blocked || [],
      extractedCourses: (reviewData.extractedCourses || []).slice(0, 50),
      extractionSource: reviewData.extractionSource || uploadedFile?.source || 'unknown',
      transcriptText: transcriptText || '',
    };
  }, [reviewData, uploadedFile, transcriptText]);

  async function handleSaveReview(payload) {
    if (!reviewData?.transcriptId) return;

    setSaveMessage('');

    const response = await fetch('/api/review-course', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcriptId: reviewData.transcriptId,
        ...payload,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to save review decision');
    }

    setReviewData((current) => applyConfirmedReview(current, payload));
    setSaveMessage(`Saved review for ${payload.rawCourse}.`);
  }

  if (loading) {
    return <main style={styles.page}>Loading Transcript Review workspace...</main>;
  }

  if (error || !reviewData) {
    const isSessionMissing = /not found|expired/i.test(error || '');

    if (isSessionMissing) {
      router.replace('/?error=review-session-expired');
      return (
        <main style={styles.page}>
          <p style={styles.error}>Review session expired. Redirecting to upload...</p>
        </main>
      );
    }

    return (
      <main style={styles.page}>
        <p style={styles.error}>{error || 'Review data unavailable.'}</p>
        <button style={styles.secondaryButton} onClick={() => router.push('/')}>Back to Upload</button>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <header style={styles.headerBar}>
        <div style={styles.headerMain}>
          <div style={styles.headerTopRow}>
            <div style={styles.headerBrand}>TransferPath</div>
            <button style={styles.backButton} onClick={() => router.push('/')}>
              ← Back
            </button>
          </div>
          <h1 style={styles.workspaceTitle}>Transcript Review Workspace</h1>
        </div>
        <div style={styles.headerItem}><strong>Student:</strong> {reviewData.studentName || 'John Doe'}</div>
        <div style={styles.headerItem}><strong>Institution:</strong> {reviewData.institution || 'Lone Star College'}</div>
        <div style={styles.headerStatus}>Status: {statusLabel(reviewData)}</div>
      </header>

      <SummaryCards
        extracted={stats?.extracted || 0}
        needsReview={stats?.needsReview || 0}
        eligible={stats?.eligible || 0}
        blocked={stats?.blocked || 0}
      />

      <section style={styles.modelBanner}>
        <p style={styles.modelSentence}>
          Show the source, show the extraction, highlight uncertainty, let humans decide, then
          explain the outcome.
        </p>
        <div style={styles.modelStepsRow}>
          {operatingModelSteps.map((step) => (
            <span key={step} style={styles.modelStepChip}>
              {step}
            </span>
          ))}
        </div>
      </section>

      {saveMessage ? <p style={styles.success}>{saveMessage}</p> : null}

      <section style={styles.mainGrid}>
        <div style={styles.leftPanel}>
          <TranscriptViewer
            fileName={uploadedFile?.name || ''}
            source={uploadedFile?.source || ''}
            pages={uploadedFile?.pages || null}
            transcriptText={transcriptText}
            highlightedText={selectedRow?.rawCourse || ''}
          />
        </div>

        <div style={styles.rightPanel}>
          <ReviewTable
            title="Extracted Course Review Table"
            extractedCourses={reviewData.extractedCourses || []}
            catalog={catalog}
            onSaveReview={handleSaveReview}
            onSelectRow={setSelectedRow}
            selectedRawCourse={selectedRow?.rawCourse || ''}
          />
        </div>
      </section>

      <section style={styles.eligibilityWrapper}>
        <EligibilityPanel
          title="Registration Eligibility"
          completed={reviewData.completed || []}
          eligibleNext={reviewData.eligibleNext || []}
          blocked={reviewData.blocked || []}
          courseDetails={courseDetails}
        />
      </section>

      <TranscriptChatWidget
        transcriptId={reviewData?.transcriptId || reviewId}
        transcriptPayload={chatTranscriptContext}
        chatContextKey={reviewData?.transcriptId || reviewId}
        title="Ask TransferPath AI"
        emptyHint="Transcript data is still loading. Please wait and try again."
        initialAssistantMessage="Review workspace loaded. Ask about any extraction, prerequisite gap, or eligibility decision."
      />
    </main>
  );
}

const styles = {
  page: {
    maxWidth: '1320px',
    margin: '0 auto',
    padding: 'clamp(0.9rem, 2vw, 1.25rem) clamp(0.75rem, 2.5vw, 1.25rem) 2rem',
    minHeight: '100vh',
    background: '#f8fafc',
    color: '#0f172a',
    fontFamily: 'Arial, sans-serif',
  },
  headerBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '0.75rem',
    alignItems: 'center',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '0.85rem 1rem',
    marginBottom: '0.9rem',
  },
  headerBrand: {
    fontWeight: 800,
    color: '#1d4ed8',
    fontSize: '1rem',
    marginBottom: '0.2rem',
  },
  headerMain: {
    display: 'flex',
    flexDirection: 'column',
  },
  headerTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.6rem',
  },
  workspaceTitle: {
    margin: 0,
    fontSize: '1.25rem',
    color: '#0f172a',
    fontWeight: 800,
  },
  headerItem: {
    fontSize: '0.92rem',
    color: '#1f2937',
  },
  headerStatus: {
    justifySelf: 'start',
    padding: '0.35rem 0.6rem',
    borderRadius: '999px',
    background: '#dbeafe',
    color: '#1e3a8a',
    fontWeight: 700,
    fontSize: '0.82rem',
  },
  modelBanner: {
    marginTop: '0.9rem',
    background: '#ffffff',
    border: '1px solid #dbe3ee',
    borderRadius: '14px',
    padding: '0.85rem 1rem',
  },
  modelSentence: {
    margin: 0,
    fontWeight: 700,
    color: '#0f172a',
  },
  modelStepsRow: {
    marginTop: '0.6rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.45rem',
  },
  modelStepChip: {
    border: '1px solid #bfdbfe',
    background: '#eff6ff',
    color: '#1e3a8a',
    borderRadius: '999px',
    padding: '0.3rem 0.6rem',
    fontSize: '0.8rem',
    fontWeight: 600,
  },
  mainGrid: {
    marginTop: '0.9rem',
    display: 'grid',
    gridTemplateColumns: 'minmax(320px, 1fr) minmax(520px, 1.25fr)',
    gap: '0.9rem',
    alignItems: 'start',
  },
  leftPanel: {
    minHeight: '560px',
  },
  rightPanel: {
    background: '#ffffff',
    border: '1px solid #dbe3ee',
    borderRadius: '14px',
    padding: '0.85rem',
  },
  eligibilityWrapper: {
    marginTop: '1.35rem',
    paddingTop: '1rem',
    borderTop: '1px solid #dbe3ee',
    background: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    padding: '1rem',
  },
  error: {
    color: '#b91c1c',
    fontWeight: 600,
  },
  success: {
    color: '#166534',
    margin: '0.8rem 0 0 0',
    fontWeight: 600,
  },
  secondaryButton: {
    background: '#e2e8f0',
    color: '#0f172a',
    border: 'none',
    padding: '0.65rem 0.9rem',
    borderRadius: '10px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  backButton: {
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#0f172a',
    borderRadius: '8px',
    padding: '0.35rem 0.6rem',
    fontWeight: 700,
    fontSize: '0.8rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
};
