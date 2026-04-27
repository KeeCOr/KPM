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
  if (!res.ok) throw new Error('Failed to add project');
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
