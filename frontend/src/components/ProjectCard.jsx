// frontend/src/components/ProjectCard.jsx
import { useState } from 'react';

function formatTime(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  if (isToday) return `오늘 ${hh}:${mm}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
}

export default function ProjectCard({ project, onUpdate, onDelete, onOpen }) {
  const [newText, setNewText] = useState('');

  const lastCreatedAt = project.instructions
    .map(i => i.createdAt)
    .sort()
    .at(-1);

  function addInstruction() {
    if (!newText.trim()) return;
    const instruction = {
      id: Date.now().toString(),
      text: newText.trim(),
      done: false,
      createdAt: new Date().toISOString(),
    };
    onUpdate({ instructions: [...project.instructions, instruction] });
    setNewText('');
  }

  function toggleInstruction(id) {
    const updated = project.instructions.map(i =>
      i.id === id ? { ...i, done: !i.done } : i
    );
    onUpdate({ instructions: updated });
  }

  function deleteInstruction(id) {
    onUpdate({ instructions: project.instructions.filter(i => i.id !== id) });
  }

  return (
    <div className="project-card">
      <div className="card-header">
        <h2>{project.name}</h2>
        <select
          value={project.status}
          onChange={e => onUpdate({ status: e.target.value })}
        >
          <option value="active">진행중</option>
          <option value="paused">일시정지</option>
          <option value="done">완료</option>
        </select>
      </div>

      <div className="card-meta">
        총 {project.instructions.length}건 · 마지막 지시: {formatTime(lastCreatedAt)}
      </div>

      <ul className="instructions">
        {project.instructions.map(i => (
          <li key={i.id}>
            <input
              type="checkbox"
              checked={i.done}
              onChange={() => toggleInstruction(i.id)}
            />
            <span className={i.done ? 'done' : ''}>{i.text}</span>
            <button onClick={() => deleteInstruction(i.id)}>✕</button>
          </li>
        ))}
      </ul>

      <div className="add-instruction">
        <input
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addInstruction()}
          placeholder="새 지시사항 추가..."
        />
        <button onClick={addInstruction}>+</button>
      </div>

      <div className="progress">
        {project.progress != null ? (
          <>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${project.progress}%` }} />
            </div>
            <span>{project.progress}%</span>
          </>
        ) : (
          <span className="no-progress">plan 파일 없음</span>
        )}
      </div>

      <div className="card-actions">
        <button onClick={onOpen}>열기</button>
        <button onClick={onDelete} className="danger">삭제</button>
      </div>
    </div>
  );
}
