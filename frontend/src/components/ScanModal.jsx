import { useState, useEffect } from 'react';
import { scanClaudeProjects, bulkAddProjects } from '../api';

export default function ScanModal({ onDone, onClose }) {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    scanClaudeProjects()
      .then(data => {
        setProjects(data.projects);
        const initialSelected = new Set(
          data.projects.map((_, i) => i).filter(i => data.projects[i].exists)
        );
        setSelected(initialSelected);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function toggle(i) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function handleAdd() {
    const toAdd = projects
      .filter((_, i) => selected.has(i))
      .map(p => ({ name: p.name, path: p.path }));
    if (!toAdd.length) return onClose();
    setAdding(true);
    try {
      await bulkAddProjects(toAdd);
      onDone();
    } catch (e) {
      setError(e.message);
      setAdding(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal modal-wide">
        <h2>Claude Code 기록에서 불러오기</h2>
        {loading && <p className="scan-status">스캔 중...</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && projects.length === 0 && (
          <p className="scan-status">새로 추가할 프로젝트가 없습니다.</p>
        )}
        {!loading && projects.length > 0 && (
          <ul className="scan-list">
            {projects.map((p, i) => (
              <li key={i} className={`scan-item${!p.exists ? ' scan-item--missing' : ''}`}>
                <label>
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggle(i)}
                    disabled={!p.exists}
                  />
                  <div className="scan-item-info">
                    <strong>{p.name}</strong>
                    <span>{p.path}</span>
                    {!p.exists && <em>폴더 없음 — 추가 불가</em>}
                  </div>
                </label>
              </li>
            ))}
          </ul>
        )}
        <div className="modal-actions">
          <button onClick={onClose} disabled={adding}>취소</button>
          <button onClick={handleAdd} disabled={adding || selected.size === 0}>
            {adding ? '추가 중...' : `${selected.size}개 추가`}
          </button>
        </div>
      </div>
    </div>
  );
}
