const express = require('express');
const { execFile } = require('child_process');
const { readProjects, writeProjects } = require('../services/storage');
const { parseProgress } = require('../services/parser');

const router = express.Router();

router.get('/', async (req, res) => {
  const data = await readProjects();
  const projects = await Promise.all(
    data.projects.map(async (p) => ({
      ...p,
      progress: await parseProgress(p.path),
    }))
  );
  res.json({ projects });
});

router.post('/', async (req, res) => {
  const { name, path: projectPath } = req.body;
  if (!name || !projectPath) {
    return res.status(400).json({ error: 'name and path required' });
  }
  const data = await readProjects();
  const project = {
    id: Date.now().toString(),
    name,
    path: projectPath,
    status: 'active',
    instructions: [],
  };
  data.projects.push(project);
  await writeProjects(data);
  res.status(201).json(project);
});

router.put('/:id', async (req, res) => {
  const data = await readProjects();
  const idx = data.projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  data.projects[idx] = { ...data.projects[idx], ...req.body };
  await writeProjects(data);
  res.json(data.projects[idx]);
});

router.delete('/:id', async (req, res) => {
  const data = await readProjects();
  const idx = data.projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  data.projects.splice(idx, 1);
  await writeProjects(data);
  res.status(204).send();
});

router.post('/:id/open', async (req, res) => {
  const data = await readProjects();
  const project = data.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'not found' });
  execFile('code', [project.path], (err) => {
    if (err) return res.status(500).json({ error: 'failed to open VSCode' });
    res.json({ ok: true });
  });
});

router.post('/:id/refresh', async (req, res) => {
  const data = await readProjects();
  const project = data.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'not found' });
  const progress = await parseProgress(project.path);
  res.json({ progress });
});

module.exports = router;
