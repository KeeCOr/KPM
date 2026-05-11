import { useState, useEffect } from 'react';
import ProjectCard from './components/ProjectCard';
import AddProjectModal from './components/AddProjectModal';
import ScanModal from './components/ScanModal';
import SettingsModal from './components/SettingsModal';
import { getProjects, addProject, updateProject, deleteProject, openProject, pushProject } from './api';
import './App.css';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await getProjects();
      setProjects(data.projects);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(name, path) {
    setError('');
    try {
      await addProject(name, path);
      setShowModal(false);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleUpdate(id, updates) {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    try {
      await updateProject(id, updates);
    } catch (e) {
      setError('저장 실패: ' + e.message);
      load();
    }
  }

  async function handleDelete(id) {
    if (!confirm('프로젝트를 삭제할까요?')) return;
    await deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
  }

  async function handlePush(id) {
    return pushProject(id);
  }

  function handleScanDone() {
    setShowScan(false);
    load();
  }

  return (
    <div className="app">
      <header>
        <h1>KPM 프로젝트 비서</h1>
        <div className="header-actions">
          <button onClick={() => setShowSettings(true)}>⚙ 규칙</button>
          <button onClick={() => setShowScan(true)}>스캔</button>
          <button onClick={load} disabled={loading}>
            {loading ? '로딩 중...' : '새로고침'}
          </button>
          <button onClick={() => { setError(''); setShowModal(true); }}>+ 추가</button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      <div className="grid">
        {projects.map(p => (
          <ProjectCard
            key={p.id}
            project={p}
            onUpdate={updates => handleUpdate(p.id, updates)}
            onDelete={() => handleDelete(p.id)}
            onOpen={() => openProject(p.id)}
            onPush={() => handlePush(p.id)}
          />
        ))}
        {projects.length === 0 && !loading && (
          <p className="empty">+ 추가 또는 스캔 버튼으로 프로젝트를 등록해주세요.</p>
        )}
      </div>

      {showModal && (
        <AddProjectModal onAdd={handleAdd} onClose={() => setShowModal(false)} />
      )}
      {showScan && (
        <ScanModal onDone={handleScanDone} onClose={() => setShowScan(false)} />
      )}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
