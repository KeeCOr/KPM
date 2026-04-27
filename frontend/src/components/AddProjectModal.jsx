// frontend/src/components/AddProjectModal.jsx
import { useState } from 'react';

export default function AddProjectModal({ onAdd, onClose }) {
  const [name, setName] = useState('');
  const [projectPath, setProjectPath] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !projectPath.trim()) return;
    onAdd(name.trim(), projectPath.trim());
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>프로젝트 추가</h2>
        <form onSubmit={handleSubmit}>
          <label>
            프로젝트명
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="SquadVsMonster"
            />
          </label>
          <label>
            폴더 경로
            <input
              value={projectPath}
              onChange={e => setProjectPath(e.target.value)}
              placeholder="C:/Users/.../MyProject"
            />
          </label>
          <div className="modal-actions">
            <button type="submit">추가</button>
            <button type="button" onClick={onClose}>취소</button>
          </div>
        </form>
      </div>
    </div>
  );
}
