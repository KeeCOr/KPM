const BASE = '/api';

export async function getProjects() {
  const res = await fetch(`${BASE}/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function addProject(name, path) {
  const res = await fetch(`${BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, path }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || '프로젝트 추가 실패');
  }
  return res.json();
}

export async function updateProject(id, updates) {
  const res = await fetch(`${BASE}/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update project');
  return res.json();
}

export async function deleteProject(id) {
  const res = await fetch(`${BASE}/projects/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete project');
}

export async function openProject(id) {
  const res = await fetch(`${BASE}/projects/${id}/open`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to open project');
}

export async function refreshProject(id) {
  const res = await fetch(`${BASE}/projects/${id}/refresh`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to refresh');
  return res.json();
}

export async function scanClaudeProjects() {
  const res = await fetch(`${BASE}/projects/scan-claude`);
  if (!res.ok) throw new Error('Claude 기록 스캔 실패');
  return res.json();
}

export async function bulkAddProjects(projects) {
  const res = await fetch(`${BASE}/projects/bulk-add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projects }),
  });
  if (!res.ok) throw new Error('일괄 추가 실패');
  return res.json();
}

export async function runExe(id) {
  const res = await fetch(`${BASE}/projects/${id}/run-exe`, { method: 'POST' });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || '실행 실패');
  return body;
}

export async function pushProject(id) {
  const res = await fetch(`${BASE}/projects/${id}/git-push`, { method: 'POST' });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Git push 실패');
  return body;
}

export async function getClaudeMessages(id) {
  const res = await fetch(`${BASE}/projects/${id}/claude-messages`);
  if (!res.ok) throw new Error('기록 로드 실패');
  return res.json();
}

export async function getPlanFile(id) {
  const res = await fetch(`${BASE}/projects/${id}/plan-file`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || '기획서 로드 실패');
  }
  return res.json();
}

export async function getLatestDoc(id) {
  const res = await fetch(`${BASE}/projects/${id}/latest-doc`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || '문서 로드 실패');
  }
  return res.json();
}

export async function createLauncher(id) {
  const res = await fetch(`${BASE}/projects/${id}/create-launcher`, { method: 'POST' });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || '런처 생성 실패');
  return body;
}

export function getGameplayPreviewUrl(id) {
  return `${BASE}/projects/${id}/gameplay-preview`;
}

export async function getSettings() {
  const res = await fetch(`${BASE}/settings`);
  if (!res.ok) throw new Error('설정 로드 실패');
  return res.json();
}

export async function updateSettings(settings) {
  const res = await fetch(`${BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('설정 저장 실패');
  return res.json();
}
