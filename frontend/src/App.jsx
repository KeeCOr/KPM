import { useState, useEffect } from 'react';
import ProjectCard from './components/ProjectCard';
import AddProjectModal from './components/AddProjectModal';
import { getProjects, addProject, updateProject, deleteProject, openProject } from './api';
import './App.css';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

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
    await addProject(name, path);
    setShowModal(false);
    load();
  }

  async function handleUpdate(id, updates) {
    await updateProject(id, updates);
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }

  async function handleDelete(id) {
    if (!confirm('프로젝트를 삭제할까요?')) return;
    await deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
  }

  return (
    <div className="app">
      <header>
        <h1>KPM 프로젝트 비서</h1>
        <div className="header-actions">
          <button onClick={load} disabled={loading}>
            {loading ? '로딩 중...' : '새로고침'}
          </button>
          <button onClick={() => setShowModal(true)}>+ 추가</button>
        </div>
      </header>

      <div className="grid">
        {projects.map(p => (
          <ProjectCard
            key={p.id}
            project={p}
            onUpdate={updates => handleUpdate(p.id, updates)}
            onDelete={() => handleDelete(p.id)}
            onOpen={() => openProject(p.id)}
          />
        ))}
        {projects.length === 0 && !loading && (
          <p className="empty">+ 추가 버튼으로 프로젝트를 등록해주세요.</p>
        )}
      </div>

      {showModal && (
        <AddProjectModal onAdd={handleAdd} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
