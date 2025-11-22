// src/components/Scanner/ScanInput.jsx
function ScanInput({ scanId, setScanId, loading, onScan, inputRef }) {
  return (
    <div className="input-group">
      <input
        ref={inputRef}
        className="scan-input"
        placeholder="Ingresa o escanea ID..."
        value={scanId}
        onChange={(e) => setScanId(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onScan()}
      />
      <button className="btn-primary" onClick={onScan} disabled={loading}>
        {loading ? "..." : "Buscar"}
      </button>
    </div>
  );
}

export default ScanInput;
