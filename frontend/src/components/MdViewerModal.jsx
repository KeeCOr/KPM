export default function MdViewerModal({ title, content, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-viewer" onClick={e => e.stopPropagation()}>
        <div className="modal-viewer-header">
          <h2>{title}</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <pre className="modal-viewer-content">{content}</pre>
      </div>
    </div>
  );
}
