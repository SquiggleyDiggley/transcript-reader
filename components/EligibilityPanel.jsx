import React from 'react';

export default function EligibilityPanel({ title = '', completed = [], eligibleNext = [], blocked = [], courseDetails = {} }) {
  return (
    <section>
      <h3 style={styles.title}>{title}</h3>
      <div style={styles.columns}>
        <Panel title="Completed" items={completed} />
        <Panel title="Eligible Next" items={eligibleNext} />
        <Panel title="Blocked" items={blocked} />
      </div>
    </section>
  );
}

function Panel({ title, items }) {
  return (
    <div style={styles.panel}>
      <div style={styles.panelTitle}>{title}</div>
      <ul style={styles.list}>{(items || []).map((it, i) => <li key={i}>{it}</li>)}</ul>
    </div>
  );
}

const styles = {
  title: { margin: 0, fontSize: '1rem', fontWeight: 800 },
  columns: { display: 'flex', gap: '0.6rem', marginTop: '0.6rem' },
  panel: { flex: '1 1 0', background: '#fff', border: '1px solid #e6eef8', borderRadius: '10px', padding: '0.6rem' },
  panelTitle: { fontWeight: 800, color: '#0f172a' },
  list: { marginTop: '0.4rem', paddingLeft: '1rem' },
};
