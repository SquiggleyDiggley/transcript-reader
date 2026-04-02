import React from 'react';

export default function SummaryCards({ extracted = 0, needsReview = 0, eligible = 0, blocked = 0 }) {
  return (
    <section style={styles.row}>
      <Card title="Extracted" value={extracted} />
      <Card title="Needs review" value={needsReview} />
      <Card title="Eligible next" value={eligible} />
      <Card title="Blocked" value={blocked} />
    </section>
  );
}

function Card({ title, value }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>{title}</div>
      <div style={styles.cardValue}>{value}</div>
    </div>
  );
}

const styles = {
  row: { display: 'flex', gap: '0.6rem', marginTop: '0.8rem' },
  card: {
    flex: '1 1 0',
    padding: '0.7rem 0.9rem',
    background: '#fff',
    border: '1px solid #e6eef8',
    borderRadius: '10px',
    textAlign: 'center',
  },
  cardTitle: { fontSize: '0.85rem', color: '#4b5563', fontWeight: 700 },
  cardValue: { fontSize: '1.25rem', color: '#0f172a', fontWeight: 900, marginTop: '0.45rem' },
};
