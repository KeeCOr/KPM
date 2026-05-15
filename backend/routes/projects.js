const express = require('express');
const { execFile, exec, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
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

router.get('/scan-claude', async (req, res) => {
  const claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');
  const data = await readProjects();
  const existingPaths = new Set(
    data.projects.map(p => p.path.toLowerCase().replace(/\\/g, '/').replace(/\/$/, ''))
  );

  try {
    const dirs = await fs.readdir(claudeProjectsDir);
    const results = [];

    for (const dir of dirs) {
      const dirPath = path.join(claudeProjectsDir, dir);
      try {
        const stat = await fs.stat(dirPath);
        if (!stat.isDirectory()) continue;
      } catch { continue; }

      const projectPath = await getPathFromJsonl(dirPath);
      if (!projectPath) continue;

      const normalized = projectPath.toLowerCase().replace(/\\/g, '/').replace(/\/$/, '');
      if (existingPaths.has(normalized)) continue;

      const exists = await fs.access(projectPath).then(() => true).catch(() => false);
      const name = path.basename(projectPath);
      results.push({ name, path: projectPath, exists });
    }

    res.json({ projects: results });
  } catch (err) {
    if (err.code === 'ENOENT') return res.json({ projects: [] });
    throw err;
  }
});

async function getPathFromJsonl(dirPath) {
  try {
    const files = await fs.readdir(dirPath);
    const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));
    if (!jsonlFiles.length) return null;

    const filePath = path.join(dirPath, jsonlFiles[jsonlFiles.length - 1]);
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n').filter(Boolean);

    for (const line of lines.slice(0, 20)) {
      try {
        const entry = JSON.parse(line);
        if (entry.cwd && typeof entry.cwd === 'string') return entry.cwd;
      } catch {}
    }
    return null;
  } catch {
    return null;
  }
}

router.post('/bulk-add', async (req, res) => {
  const { projects: toAdd } = req.body;
  if (!Array.isArray(toAdd) || toAdd.length === 0) {
    return res.status(400).json({ error: 'projects array required' });
  }

  const data = await readProjects();
  const added = [];
  const now = Date.now();

  for (let i = 0; i < toAdd.length; i++) {
    const { name, path: projectPath } = toAdd[i];
    if (!name || !projectPath) continue;
    const project = {
      id: (now + i).toString(),
      name,
      path: projectPath,
      status: 'active',
      instructions: [],
    };
    data.projects.push(project);
    added.push(project);
  }

  await writeProjects(data);
  res.status(201).json({ added });
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

router.post('/:id/git-push', async (req, res) => {
  const data = await readProjects();
  const project = data.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'not found' });

  exec('git push', { cwd: project.path }, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: stderr || err.message });
    res.json({ ok: true, output: stdout || 'Push 완료' });
  });
});

router.post('/:id/run-exe', async (req, res) => {
  const data = await readProjects();
  const project = data.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'not found' });

  const exeFile = await findLatestExe(project.path);
  if (!exeFile) return res.status(404).json({ error: '실행파일 없음' });

  const exeName = path.basename(exeFile);
  const exeDir = path.dirname(exeFile);
  exec(`start "" "${exeFile}"`, { shell: true, cwd: exeDir }, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true, name: exeName });
  });
});

router.post('/:id/create-launcher', async (req, res) => {
  const data = await readProjects();
  const project = data.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'not found' });

  const lines = [
    '@echo off',
    'for /f "delims=" %%i in (\'powershell -NoProfile -Command "Get-ChildItem -Path \\"%~dp0\\" -Filter \\"*_portable.exe\\" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName"\') do (',
    '    start "" "%%i"',
    '    exit /b',
    ')',
    'echo 실행파일을 찾을 수 없습니다.',
    'pause',
  ];
  const batContent = lines.join('\r\n') + '\r\n';

  const batPath = path.join(project.path, `${project.name}.bat`);
  try {
    await fs.writeFile(batPath, batContent, 'utf8');
    res.json({ ok: true, path: batPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/claude-messages', async (req, res) => {
  const data = await readProjects();
  const project = data.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'not found' });

  const claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');
  const normalizedPath = project.path.toLowerCase().replace(/\\/g, '/');

  try {
    const dirs = await fs.readdir(claudeProjectsDir);
    let matchedDir = null;

    for (const dir of dirs) {
      const dirPath = path.join(claudeProjectsDir, dir);
      const cwd = await getPathFromJsonl(dirPath);
      if (cwd && cwd.toLowerCase().replace(/\\/g, '/') === normalizedPath) {
        matchedDir = dirPath;
        break;
      }
    }

    if (!matchedDir) return res.json({ messages: [] });

    const files = await fs.readdir(matchedDir);
    const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));
    const messages = [];

    for (const jsonlFile of jsonlFiles) {
      const filePath = path.join(matchedDir, jsonlFile);
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry.type === 'user' && entry.message?.role === 'user') {
            const textContent = entry.message.content?.find(c => c.type === 'text');
            if (textContent?.text?.trim()) {
              messages.push({ text: textContent.text.trim(), timestamp: entry.timestamp });
            }
          }
        } catch {}
      }
    }

    messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json({ messages: messages.slice(0, 30) });
  } catch (err) {
    if (err.code === 'ENOENT') return res.json({ messages: [] });
    throw err;
  }
});

router.get('/:id/plan-file', async (req, res) => {
  const data = await readProjects();
  const project = data.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'not found' });

  const plansDir = path.join(project.path, 'docs', 'superpowers', 'plans');
  try {
    const files = await fs.readdir(plansDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    if (!mdFiles.length) return res.status(404).json({ error: '기획서 없음' });

    const stats = await Promise.all(
      mdFiles.map(async f => ({ name: f, path: path.join(plansDir, f), mtime: (await fs.stat(path.join(plansDir, f))).mtimeMs }))
    );
    stats.sort((a, b) => b.mtime - a.mtime);
    const latest = stats[0];
    const content = await fs.readFile(latest.path, 'utf8');
    res.json({ name: latest.name, content });
  } catch (err) {
    if (err.code === 'ENOENT') return res.status(404).json({ error: '기획서 없음' });
    throw err;
  }
});

router.get('/:id/latest-doc', async (req, res) => {
  const data = await readProjects();
  const project = data.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'not found' });

  const plansDir = path.join(project.path, 'docs', 'superpowers', 'plans');
  const mdFiles = [];
  await collectMdFiles(project.path, mdFiles, plansDir, 0);

  if (!mdFiles.length) return res.status(404).json({ error: '문서 없음' });

  mdFiles.sort((a, b) => b.mtime - a.mtime);
  const latest = mdFiles[0];
  const content = await fs.readFile(latest.path, 'utf8');
  res.json({ name: path.relative(project.path, latest.path), content });
});

const MD_SKIP_DIRS = new Set(['node_modules', '.git', 'Library', 'Temp', 'obj', '.vs', 'Packages', '__pycache__']);

async function collectMdFiles(dirPath, results, excludeDir, depth) {
  if (depth > 5) return;
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        if (!MD_SKIP_DIRS.has(entry.name) && fullPath !== excludeDir) {
          await collectMdFiles(fullPath, results, excludeDir, depth + 1);
        }
      } else if (entry.name.endsWith('.md')) {
        const stat = await fs.stat(fullPath).catch(() => null);
        if (stat) results.push({ path: fullPath, mtime: stat.mtimeMs });
      }
    }
  } catch {}
}

const EXE_SKIP_DIRS = new Set(['node_modules', '.git', 'Library', 'Temp', 'obj', 'bin', '.vs', 'Packages', '__pycache__']);

async function findLatestExe(dirPath) {
  const files = [];
  await collectExeFiles(dirPath, files, 0);
  if (!files.length) return null;
  files.sort((a, b) => b.mtime - a.mtime);
  return files[0].path;
}

async function collectExeFiles(dirPath, results, depth) {
  if (depth > 6) return;
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!EXE_SKIP_DIRS.has(entry.name)) {
          await collectExeFiles(path.join(dirPath, entry.name), results, depth + 1);
        }
      } else if (entry.name.toLowerCase().endsWith('.exe')) {
        const fullPath = path.join(dirPath, entry.name);
        const stat = await fs.stat(fullPath).catch(() => null);
        if (stat) results.push({ path: fullPath, mtime: stat.mtimeMs });
      }
    }
  } catch {}
}

router.get('/:id/gameplay-preview', async (req, res) => {
  const data = await readProjects();
  const project = data.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'not found' });

  const docsDir = path.join(project.path, 'docs');
  const patterns = ['gameplay_preview.png', 'gameplay_preview.jpg', 'gameplay_preview.webp'];

  try {
    const files = await fs.readdir(docsDir).catch(() => []);
    for (const pattern of patterns) {
      const match = files.find(f => f.toLowerCase().endsWith(pattern.toLowerCase()));
      if (match) {
        const filePath = path.join(docsDir, match);
        return res.sendFile(filePath);
      }
    }

    // Also check root directory
    const rootFiles = await fs.readdir(project.path).catch(() => []);
    for (const pattern of patterns) {
      const match = rootFiles.find(f => f.toLowerCase().includes('gameplay') && f.toLowerCase().endsWith(pattern.split('.').pop()));
      if (match) {
        const filePath = path.join(project.path, match);
        return res.sendFile(filePath);
      }
    }

    return res.status(404).json({ error: '플레이 이미지 없음' });
  } catch (err) {
    return res.status(404).json({ error: '플레이 이미지 없음' });
  }
});

module.exports = router;
