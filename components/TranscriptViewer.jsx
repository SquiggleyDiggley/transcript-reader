import React from 'react';

export default function TranscriptViewer({ fileName = '', source = '', pages = null, transcriptText = '', highlightedText = '' }) {
  return (
    <aside style={styles.container}>
      <div style={styles.header}>
        <strong>{fileName || 'Transcript'}</strong>
        <div style={styles.source}>{source}</div>
      </div>

      <div style={styles.viewer}>
        <pre style={styles.pre}>{transcriptText || 'No transcript text available.'}</pre>
        {highlightedText ? <div style={styles.highlight}>Highlighted: {highlightedText}</div> : null}
      </div>
    </aside>
  );
}

const styles = {
  container: { background: '#ffffff', border: '1px solid #e6eef8', borderRadius: '10px', padding: '0.75rem', minHeight: '480px' },
  header: { marginBottom: '0.6rem' },
  source: { fontSize: '0.8rem', color: '#64748b' },
  viewer: { overflow: 'auto', maxHeight: '540px' },
  pre: { whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.9rem', color: '#0f172a' },
  highlight: { marginTop: '0.6rem', padding: '0.4rem', background: '#fffbeb', borderRadius: '6px', border: '1px solid #fef3c7' },
};
