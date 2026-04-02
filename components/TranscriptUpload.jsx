export default function TranscriptUpload({ onFileChange, onUpload, file, loading }) {
  return (
    <div>
      <input
        type="file"
        accept=".txt,.pdf"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
      />
      <button onClick={() => void onUpload()} disabled={!file || loading} style={{ marginLeft: '1rem' }}>
        {loading ? 'Processing...' : 'Upload Transcript'}
      </button>
    </div>
  );
}
