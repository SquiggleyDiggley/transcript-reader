'use client';

import { useEffect, useMemo, useState } from 'react';

const badgeStyles = {
  green: { background: '#dcfce7', color: '#166534' },
  yellow: { background: '#fef3c7', color: '#92400e' },
  red: { background: '#fee2e2', color: '#991b1b' },
};

export default function ReviewTable({ extractedCourses = [], catalog = [], onSaveReview }) {
  const [rows, setRows] = useState([]);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    setRows(
      extractedCourses.map((course, index) => ({
        id: index,
        rawCourse: course.rawCourse || '',
        grade: course.grade || '',
        credits: course.credits ?? '',
        matchedEquivalent: course.matchedEquivalent || '',
        confidence: Number(course.confidence || 0),
        needsReview: Boolean(course.needsReview),
        matchReason: course.matchReason || 'No explanation provided',
        confidenceBand: course.confidenceBand || 'red',
        reviewerNote: '',
        status: course.needsReview ? 'Needs Review' : 'Suggested',
      })),
    );
  }, [extractedCourses]);

  const reviewCount = useMemo(() => rows.filter((row) => row.needsReview).length, [rows]);

  function handleEquivalentChange(id, value) {
    setRows((current) =>
      current.map((row) =>
        row.id === id
          ? {
              ...row,
              matchedEquivalent: value,
              needsReview: !value,
              status: value ? 'Ready to Confirm' : 'Needs Review',
            }
          : row,
      ),
    );
  }

  function handleNoteChange(id, value) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, reviewerNote: value } : row)),
    );
  }

  async function handleConfirm(row) {
    try {
      setSavingId(row.id);
      await onSaveReview({
        rawCourse: row.rawCourse,
        confirmedEquivalent: row.matchedEquivalent,
        grade: row.grade,
        credits: row.credits === '' ? null : Number(row.credits),
        reviewerNote: row.reviewerNote,
      });

      setRows((current) =>
        current.map((item) =>
          item.id === row.id
            ? {
                ...item,
                needsReview: false,
                status: 'Confirmed',
              }
            : item,
        ),
      );
    } finally {
      setSavingId(null);
    }
  }

  if (!rows.length) return null;

  return (
    <section style={{ marginTop: '2rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ marginBottom: '0.25rem' }}>Review Queue</h2>
        <p style={{ margin: 0, color: '#334155' }}>
          {reviewCount > 0
            ? `${reviewCount} course${reviewCount === 1 ? '' : 's'} still awaiting registrar confirmation.`
            : 'All extracted courses have been confirmed.'}
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{ borderCollapse: 'collapse', width: '100%', background: '#fff', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)' }}
        >
          <thead>
            <tr>
              {['Raw Course', 'Grade', 'Credits', 'Suggested Equivalent', 'Confidence', 'Why This Match?', 'Review Note', 'Status', 'Action'].map((label) => (
                <th
                  key={label}
                  style={{ border: '1px solid #d1d5db', padding: '10px', textAlign: 'left', background: '#f8fafc' }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td style={{ border: '1px solid #d1d5db', padding: '10px' }}>{row.rawCourse}</td>
                <td style={{ border: '1px solid #d1d5db', padding: '10px' }}>{row.grade || '-'}</td>
                <td style={{ border: '1px solid #d1d5db', padding: '10px' }}>{row.credits === '' ? '-' : row.credits}</td>
                <td style={{ border: '1px solid #d1d5db', padding: '10px' }}>
                  <select
                    value={row.matchedEquivalent}
                    onChange={(event) => handleEquivalentChange(row.id, event.target.value)}
                    style={{ minWidth: '180px' }}
                  >
                    <option value="">Select catalog course</option>
                    {catalog.map((courseCode) => (
                      <option key={courseCode} value={courseCode}>
                        {courseCode}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '10px' }}>
                  <span
                    style={{
                      ...badgeStyles[row.confidenceBand],
                      padding: '4px 8px',
                      borderRadius: '999px',
                      fontWeight: 600,
                      display: 'inline-block',
                    }}
                  >
                    {Math.round(row.confidence * 100)}%
                  </span>
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '10px', maxWidth: '260px' }}>{row.matchReason}</td>
                <td style={{ border: '1px solid #d1d5db', padding: '10px' }}>
                  <input
                    type="text"
                    value={row.reviewerNote}
                    onChange={(event) => handleNoteChange(row.id, event.target.value)}
                    placeholder="Optional note"
                  />
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '10px' }}>{row.status}</td>
                <td style={{ border: '1px solid #d1d5db', padding: '10px' }}>
                  <button
                    onClick={() => handleConfirm(row)}
                    disabled={!row.matchedEquivalent || savingId === row.id}
                    style={{
                      padding: '0.35rem 0.6rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: !row.matchedEquivalent || savingId === row.id ? '#f1f5f9' : '#eff6ff',
                      color: '#1e3a8a',
                      fontWeight: 600,
                    }}
                  >
                    {savingId === row.id ? 'Saving...' : 'Confirm'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}