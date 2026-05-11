import { useState, useEffect } from 'react';
import { runExe, getClaudeMessages, getPlanFile, getLatestDoc } from '../api';
import MdViewerModal from './MdViewerModal';

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

export default function ProjectCard({ project, onUpdate, onDelete, onOpen, onPush }) {
  const [newText, setNewText] = useState('');
  const [instructions, setInstructions] = useState(project.instructions || []);
  const [pushStatus, setPushStatus] = useState('');
  const [exeStatus, setExeStatus] = useState('');
  const [claudeMessages, setClaudeMessages] = useState(null);
  const [showClaude, setShowClaude] = useState(false);
  const [claudeLoading, setClaudeLoading] = useState(false);
  const [mdViewer, setMdViewer] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [docLoading, setDocLoading] = useState(false);

  useEffect(() => {
    setInstructions(project.instructions || []);
  }, [project.id]);

  const lastCreatedAt = instructions.map(i => i.createdAt).sort().at(-1);

  function saveInstructions(updated) {
    setInstructions(updated);
    onUpdate({ instructions: updated });
  }

  function addInstruction() {
    if (!newText.trim()) return;
    const instruction = {
      id: Date.now().toString(),
      text: newText.trim(),
      done: false,
      createdAt: new Date().toISOString(),
    };
    saveInstructions([...instructions, instruction]);
    setNewText('');
  }

  function toggleInstruction(id) {
    saveInstructions(instructions.map(i => i.id === id ? { ...i, done: !i.done } : i));
  }

  function deleteInstruction(id) {
    saveInstructions(instructions.filter(i => i.id !== id));
  }

  async function handlePushClick() {
    setPushStatus('pushing');
    try {
      await onPush();
      setPushStatus('done');
      setTimeout(() => setPushStatus(''), 3000);
    } catch (e) {
      setPushStatus(e.message || 'error');
      setTimeout(() => setPushStatus(''), 4000);
    }
  }

  async function handleRunExe() {
    setExeStatus('running');
    try {
      const result = await runExe(project.id);
      setExeStatus(result.name || 'done');
      setTimeout(() => setExeStatus(''), 4000);
    } catch (e) {
      setExeStatus(e.message || 'error');
      setTimeout(() => setExeStatus(''), 4000);
    }
  }

  async function toggleClaude() {
    const next = !showClaude;
    setShowClaude(next);
    if (next && claudeMessages === null) {
      setClaudeLoading(true);
      try {
        const data = await getClaudeMessages(project.id);
        setClaudeMessages(data.messages);
      } catch {
        setClaudeMessages([]);
      } finally {
        setClaudeLoading(false);
      }
    }
  }

  async function handlePlanFile() {
    setPlanLoading(true);
    try {
      const data = await getPlanFile(project.id);
      setMdViewer({ title: data.name, content: data.content });
    } catch (e) {
      alert(e.message);
    } finally {
      setPlanLoading(false);
    }
  }

  async function handleLatestDoc() {
    setDocLoading(true);
    try {
      const data = await getLatestDoc(project.id);
      setMdViewer({ title: data.name, content: data.content });
    } catch (e) {
      alert(e.message);
    } finally {
      setDocLoading(false);
    }
  }

  const pushLabel =
    pushStatus === 'pushing' ? '...' :
    pushStatus === 'done' ? '완료!' :
    pushStatus ? '실패' : 'Push';

  const exeLabel =
    exeStatus === 'running' ? '...' :
    exeStatus ? exeStatus : '▶ 실행';

  return (
    <>
    {mdViewer && (
      <MdViewerModal
        title={mdViewer.title}
        content={mdViewer.content}
        onClose={() => setMdViewer(null)}
      />
    )}
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
        총 {instructions.length}건 · 마지막 지시: {formatTime(lastCreatedAt)}
      </div>

      <ul className="instructions">
        {instructions.map(i => (
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
          onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && addInstruction()}
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

      <div className="claude-section">
        <button className="claude-toggle" onClick={toggleClaude}>
          Claude 기록 {showClaude ? '▲' : '▼'}
        </button>
        {showClaude && (
          <ul className="claude-list">
            {claudeLoading && <li className="claude-status">불러오는 중...</li>}
            {!claudeLoading && claudeMessages?.length === 0 && (
              <li className="claude-status">기록 없음</li>
            )}
            {!claudeLoading && claudeMessages?.map((m, i) => (
              <li key={i} className="claude-msg">
                <span className="claude-msg-text">{m.text}</span>
                <span className="claude-msg-time">{formatTime(m.timestamp)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card-actions">
        <button
          onClick={handleRunExe}
          disabled={exeStatus === 'running'}
          className={exeStatus && exeStatus !== 'running' && exeStatus !== 'done' ? 'exe-error' : ''}
          title="최근 실행파일 열기"
        >
          {exeLabel}
        </button>
        <button
          onClick={handlePushClick}
          disabled={pushStatus === 'pushing'}
          className={pushStatus === 'done' ? 'push-done' : pushStatus && pushStatus !== 'pushing' ? 'push-error' : ''}
          title="git push"
        >
          {pushLabel}
        </button>
        <button onClick={onOpen}>열기</button>
        <button onClick={handlePlanFile} disabled={planLoading} title="기획서 열람">
          {planLoading ? '...' : '기획서'}
        </button>
        <button onClick={handleLatestDoc} disabled={docLoading} title="최신 문서 열람">
          {docLoading ? '...' : '문서'}
        </button>
        <button onClick={onDelete} className="danger">삭제</button>
      </div>

      {pushStatus && pushStatus !== 'pushing' && pushStatus !== 'done' && (
        <div className="push-msg push-msg--error">{pushStatus}</div>
      )}
    </div>
    </>
  );
}
