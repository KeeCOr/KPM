# KPM 프로젝트 대시보드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local web dashboard to view all Claude Code projects with manually entered instructions and auto-calculated progress from superpowers plan files.

**Architecture:** Express backend serves a REST API that reads/writes `projects.json` and parses markdown plan files for progress percentages. React frontend (Vite) renders project cards with checklists, progress bars, and a VSCode launch button. Vite proxies `/api` to the backend.

**Tech Stack:** Node.js 18+, Express 4, cors, React 18, Vite 5, Jest + Supertest (backend), Vitest + React Testing Library (frontend)

---

## File Structure

```
0_KPM/
├── projects.json                          # Project data (auto-created on first write)
├── backend/
│   ├── package.json
│   ├── server.js                          # Express app + listen
│   ├── routes/
│   │   └── projects.js                    # All /api/projects/* routes
│   ├── services/
│   │   ├── storage.js                     # Read/write projects.json
│   │   └── parser.js                      # Scan plan .md files → progress %
│   └── __tests__/
│       ├── storage.test.js
│       ├── parser.test.js
│       └── routes.test.js
└── frontend/
    ├── package.json
    ├── vite.config.js                     # Proxy + Vitest config
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                        # Root: fetch, header, grid
        ├── App.css                        # All styles
        ├── setupTests.js
        ├── api.js                         # Fetch wrappers for all endpoints
        └── components/
            ├── ProjectCard.jsx            # Card: name, status, instructions, progress
            ├── ProjectCard.test.jsx
            ├── AddProjectModal.jsx        # Modal: add project form
            └── AddProjectModal.test.jsx
```

---

### Task 1: Backend project setup

**Files:**
- Create: `backend/package.json`
- Create: `backend/server.js`
- Create: `projects.json`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p backend/routes backend/services backend/__tests__
```

- [ ] **Step 2: Create `backend/package.json`**

```json
{
  "name": "kpm-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "test": "jest"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.4"
  },
  "jest": {
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 3: Install backend dependencies**

```bash
cd backend && npm install
```

Expected: `added N packages in Xs`

- [ ] **Step 4: Create `backend/server.js`**

```javascript
const express = require('express');
const cors = require('cors');
const projectsRouter = require('./routes/projects');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/projects', projectsRouter);

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
```

- [ ] **Step 5: Create empty `projects.json` at project root**

```json
{ "projects": [] }
```

- [ ] **Step 6: Create stub routes file so server.js doesn't crash**

```javascript
// backend/routes/projects.js
const express = require('express');
const router = express.Router();
module.exports = router;
```

- [ ] **Step 7: Verify server starts**

```bash
cd backend && node server.js
```

Expected: `Server running on http://localhost:3001`

Press Ctrl+C to stop.

- [ ] **Step 8: Commit**

```bash
git init
git add backend/ projects.json
git commit -m "feat: backend project setup"
```

---

### Task 2: Storage service

**Files:**
- Create: `backend/services/storage.js`
- Create: `backend/__tests__/storage.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// backend/__tests__/storage.test.js
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { readProjects, writeProjects } = require('../services/storage');

describe('storage', () => {
  let tmpFile;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `kpm-test-${Date.now()}.json`);
  });

  afterEach(async () => {
    await fs.unlink(tmpFile).catch(() => {});
  });

  test('readProjects returns empty array when file does not exist', async () => {
    const result = await readProjects('/nonexistent/path.json');
    expect(result).toEqual({ projects: [] });
  });

  test('writeProjects and readProjects round-trip', async () => {
    const data = { projects: [{ id: '1', name: 'Test' }] };
    await writeProjects(data, tmpFile);
    const result = await readProjects(tmpFile);
    expect(result).toEqual(data);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npm test -- --testPathPattern=storage
```

Expected: FAIL — `Cannot find module '../services/storage'`

- [ ] **Step 3: Implement `backend/services/storage.js`**

```javascript
const fs = require('fs').promises;
const path = require('path');

const DEFAULT_DATA_FILE = path.join(__dirname, '../../projects.json');

async function readProjects(filePath = DEFAULT_DATA_FILE) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { projects: [] };
  }
}

async function writeProjects(data, filePath = DEFAULT_DATA_FILE) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = { readProjects, writeProjects };
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend && npm test -- --testPathPattern=storage
```

Expected:
```
PASS __tests__/storage.test.js
  storage
    ✓ readProjects returns empty array when file does not exist
    ✓ writeProjects and readProjects round-trip
```

- [ ] **Step 5: Commit**

```bash
git add backend/services/storage.js backend/__tests__/storage.test.js
git commit -m "feat: storage service for projects.json"
```

---

### Task 3: Plan parser service

**Files:**
- Create: `backend/services/parser.js`
- Create: `backend/__tests__/parser.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// backend/__tests__/parser.test.js
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { parseProgress } = require('../services/parser');

describe('parseProgress', () => {
  let tmpDir;
  let plansDir;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `kpm-test-${Date.now()}`);
    plansDir = path.join(tmpDir, 'docs', 'superpowers', 'plans');
    await fs.mkdir(plansDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('returns null when no plan files exist', async () => {
    const result = await parseProgress(tmpDir);
    expect(result).toBeNull();
  });

  test('calculates progress from checkboxes', async () => {
    const content = '- [x] Done\n- [x] Also done\n- [ ] Pending\n';
    await fs.writeFile(path.join(plansDir, 'plan.md'), content, 'utf-8');
    const result = await parseProgress(tmpDir);
    expect(result).toBe(67); // Math.round(2/3 * 100)
  });

  test('returns null when plan file has no checkboxes', async () => {
    await fs.writeFile(path.join(plansDir, 'plan.md'), '# No checkboxes', 'utf-8');
    const result = await parseProgress(tmpDir);
    expect(result).toBeNull();
  });

  test('aggregates multiple plan files', async () => {
    await fs.writeFile(path.join(plansDir, 'a.md'), '- [x] Done\n- [ ] Todo\n', 'utf-8');
    await fs.writeFile(path.join(plansDir, 'b.md'), '- [x] Done\n- [x] Done\n', 'utf-8');
    const result = await parseProgress(tmpDir);
    expect(result).toBe(75); // 3/4
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npm test -- --testPathPattern=parser
```

Expected: FAIL — `Cannot find module '../services/parser'`

- [ ] **Step 3: Implement `backend/services/parser.js`**

```javascript
const fs = require('fs').promises;
const path = require('path');

async function getMarkdownFiles(dir) {
  try {
    const files = await fs.readdir(dir);
    return files
      .filter(f => f.endsWith('.md'))
      .map(f => path.join(dir, f));
  } catch {
    return [];
  }
}

async function parseProgress(projectPath) {
  const plansDir = path.join(projectPath, 'docs', 'superpowers', 'plans');
  const files = await getMarkdownFiles(plansDir);
  if (files.length === 0) return null;

  let done = 0;
  let total = 0;

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const doneMatches = content.match(/- \[x\]/gi) || [];
    const todoMatches = content.match(/- \[ \]/g) || [];
    done += doneMatches.length;
    total += doneMatches.length + todoMatches.length;
  }

  if (total === 0) return null;
  return Math.round((done / total) * 100);
}

module.exports = { parseProgress };
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend && npm test -- --testPathPattern=parser
```

Expected:
```
PASS __tests__/parser.test.js
  parseProgress
    ✓ returns null when no plan files exist
    ✓ calculates progress from checkboxes
    ✓ returns null when plan file has no checkboxes
    ✓ aggregates multiple plan files
```

- [ ] **Step 5: Commit**

```bash
git add backend/services/parser.js backend/__tests__/parser.test.js
git commit -m "feat: plan file parser for progress calculation"
```

---

### Task 4: API routes

**Files:**
- Modify: `backend/routes/projects.js`
- Create: `backend/__tests__/routes.test.js`

- [ ] **Step 1: Write the failing tests**

```javascript
// backend/__tests__/routes.test.js
const request = require('supertest');

jest.mock('../services/storage');
jest.mock('../services/parser');
jest.mock('child_process', () => ({
  execFile: jest.fn((cmd, args, cb) => cb(null)),
}));

const storage = require('../services/storage');
const parser = require('../services/parser');
const app = require('../server');

const mockProject = {
  id: '1',
  name: 'TestProject',
  path: 'C:/test',
  status: 'active',
  instructions: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  storage.readProjects.mockResolvedValue({ projects: [mockProject] });
  storage.writeProjects.mockResolvedValue();
  parser.parseProgress.mockResolvedValue(50);
});

describe('GET /api/projects', () => {
  test('returns projects with progress', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body.projects[0].progress).toBe(50);
    expect(res.body.projects[0].name).toBe('TestProject');
  });
});

describe('POST /api/projects', () => {
  test('adds a new project', async () => {
    storage.readProjects.mockResolvedValue({ projects: [] });
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'NewProject', path: 'C:/new' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('NewProject');
    expect(storage.writeProjects).toHaveBeenCalled();
  });

  test('returns 400 when name or path is missing', async () => {
    const res = await request(app).post('/api/projects').send({ name: 'Only name' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/projects/:id', () => {
  test('updates project fields', async () => {
    const res = await request(app)
      .put('/api/projects/1')
      .send({ status: 'paused' });
    expect(res.status).toBe(200);
    expect(storage.writeProjects).toHaveBeenCalled();
  });

  test('returns 404 for unknown id', async () => {
    const res = await request(app).put('/api/projects/999').send({ status: 'done' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/projects/:id', () => {
  test('removes project', async () => {
    const res = await request(app).delete('/api/projects/1');
    expect(res.status).toBe(204);
    expect(storage.writeProjects).toHaveBeenCalled();
  });
});

describe('POST /api/projects/:id/open', () => {
  test('opens project in VSCode', async () => {
    const { execFile } = require('child_process');
    const res = await request(app).post('/api/projects/1/open');
    expect(res.status).toBe(200);
    expect(execFile).toHaveBeenCalledWith('code', ['C:/test'], expect.any(Function));
  });
});

describe('POST /api/projects/:id/refresh', () => {
  test('returns fresh progress', async () => {
    parser.parseProgress.mockResolvedValue(80);
    const res = await request(app).post('/api/projects/1/refresh');
    expect(res.status).toBe(200);
    expect(res.body.progress).toBe(80);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend && npm test -- --testPathPattern=routes
```

Expected: FAIL — routes are all stubs

- [ ] **Step 3: Implement `backend/routes/projects.js`**

```javascript
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
```

- [ ] **Step 4: Run all backend tests**

```bash
cd backend && npm test
```

Expected:
```
PASS __tests__/storage.test.js
PASS __tests__/parser.test.js
PASS __tests__/routes.test.js
Test Suites: 3 passed, 3 total
```

- [ ] **Step 5: Commit**

```bash
git add backend/routes/projects.js backend/__tests__/routes.test.js
git commit -m "feat: API routes for projects CRUD + VSCode open"
```

---

### Task 5: Frontend setup

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.jsx`
- Create: `frontend/src/setupTests.js`

- [ ] **Step 1: Create `frontend/package.json`**

```json
{
  "name": "kpm-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.2",
    "@testing-library/react": "^14.3.1",
    "@testing-library/user-event": "^14.5.2",
    "@vitejs/plugin-react": "^4.2.1",
    "jsdom": "^24.0.0",
    "vite": "^5.2.0",
    "vitest": "^1.5.0"
  }
}
```

- [ ] **Step 2: Install frontend dependencies**

```bash
cd frontend && npm install
```

Expected: `added N packages in Xs`

- [ ] **Step 3: Create `frontend/vite.config.js`**

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
});
```

- [ ] **Step 4: Create `frontend/index.html`**

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>KPM 프로젝트 비서</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `frontend/src/setupTests.js`**

```javascript
import '@testing-library/jest-dom';
```

- [ ] **Step 6: Create `frontend/src/main.jsx`**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 7: Create stub `frontend/src/App.jsx` to verify dev server works**

```jsx
export default function App() {
  return <h1>KPM 프로젝트 비서</h1>;
}
```

- [ ] **Step 8: Start dev server and verify**

```bash
cd frontend && npm run dev
```

Expected: `Local: http://localhost:5173/`

Open browser — should show "KPM 프로젝트 비서". Press Ctrl+C.

- [ ] **Step 9: Commit**

```bash
git add frontend/
git commit -m "feat: frontend Vite+React setup"
```

---

### Task 6: API client

**Files:**
- Create: `frontend/src/api.js`

- [ ] **Step 1: Create `frontend/src/api.js`**

```javascript
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/api.js
git commit -m "feat: frontend API client"
```

---

### Task 7: ProjectCard component

**Files:**
- Create: `frontend/src/components/ProjectCard.jsx`
- Create: `frontend/src/components/ProjectCard.test.jsx`

- [ ] **Step 1: Write the failing tests**

```jsx
// frontend/src/components/ProjectCard.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectCard from './ProjectCard';

const project = {
  id: '1',
  name: 'SquadVsMonster',
  status: 'active',
  instructions: [
    { id: 'a', text: '보스 패턴 추가', done: false, createdAt: '2026-04-27T14:30:00Z' },
    { id: 'b', text: '사운드 연동', done: true, createdAt: '2026-04-27T10:00:00Z' },
  ],
  progress: 50,
};

test('renders project name', () => {
  render(<ProjectCard project={project} onUpdate={vi.fn()} onDelete={vi.fn()} onOpen={vi.fn()} />);
  expect(screen.getByText('SquadVsMonster')).toBeInTheDocument();
});

test('shows instruction count', () => {
  render(<ProjectCard project={project} onUpdate={vi.fn()} onDelete={vi.fn()} onOpen={vi.fn()} />);
  expect(screen.getByText(/총 2건/)).toBeInTheDocument();
});

test('renders instruction texts', () => {
  render(<ProjectCard project={project} onUpdate={vi.fn()} onDelete={vi.fn()} onOpen={vi.fn()} />);
  expect(screen.getByText('보스 패턴 추가')).toBeInTheDocument();
  expect(screen.getByText('사운드 연동')).toBeInTheDocument();
});

test('shows progress percentage', () => {
  render(<ProjectCard project={project} onUpdate={vi.fn()} onDelete={vi.fn()} onOpen={vi.fn()} />);
  expect(screen.getByText('50%')).toBeInTheDocument();
});

test('calls onUpdate when adding instruction via Enter', () => {
  const onUpdate = vi.fn();
  render(<ProjectCard project={project} onUpdate={onUpdate} onDelete={vi.fn()} onOpen={vi.fn()} />);
  const input = screen.getByPlaceholderText('새 지시사항 추가...');
  fireEvent.change(input, { target: { value: '새 기능' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(onUpdate).toHaveBeenCalledWith(
    expect.objectContaining({
      instructions: expect.arrayContaining([
        expect.objectContaining({ text: '새 기능', done: false }),
      ]),
    })
  );
});

test('calls onOpen when open button clicked', () => {
  const onOpen = vi.fn();
  render(<ProjectCard project={project} onUpdate={vi.fn()} onDelete={vi.fn()} onOpen={onOpen} />);
  fireEvent.click(screen.getByRole('button', { name: '열기' }));
  expect(onOpen).toHaveBeenCalled();
});

test('shows dash for missing progress', () => {
  const p = { ...project, progress: null };
  render(<ProjectCard project={p} onUpdate={vi.fn()} onDelete={vi.fn()} onOpen={vi.fn()} />);
  expect(screen.getByText('plan 파일 없음')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm test -- ProjectCard
```

Expected: FAIL — `Cannot find module './ProjectCard'`

- [ ] **Step 3: Create `frontend/src/components/ProjectCard.jsx`**

```jsx
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- ProjectCard
```

Expected:
```
✓ src/components/ProjectCard.test.jsx (7 tests)
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ProjectCard.jsx frontend/src/components/ProjectCard.test.jsx
git commit -m "feat: ProjectCard component"
```

---

### Task 8: AddProjectModal component

**Files:**
- Create: `frontend/src/components/AddProjectModal.jsx`
- Create: `frontend/src/components/AddProjectModal.test.jsx`

- [ ] **Step 1: Write the failing tests**

```jsx
// frontend/src/components/AddProjectModal.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import AddProjectModal from './AddProjectModal';

test('calls onAdd with name and path on submit', () => {
  const onAdd = vi.fn();
  render(<AddProjectModal onAdd={onAdd} onClose={vi.fn()} />);

  fireEvent.change(screen.getByPlaceholderText('SquadVsMonster'), {
    target: { value: 'MyProject' },
  });
  fireEvent.change(screen.getByPlaceholderText('C:/Users/.../MyProject'), {
    target: { value: 'C:/test/path' },
  });
  fireEvent.click(screen.getByRole('button', { name: '추가' }));

  expect(onAdd).toHaveBeenCalledWith('MyProject', 'C:/test/path');
});

test('calls onClose when cancel is clicked', () => {
  const onClose = vi.fn();
  render(<AddProjectModal onAdd={vi.fn()} onClose={onClose} />);
  fireEvent.click(screen.getByRole('button', { name: '취소' }));
  expect(onClose).toHaveBeenCalled();
});

test('does not call onAdd when fields are empty', () => {
  const onAdd = vi.fn();
  render(<AddProjectModal onAdd={onAdd} onClose={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: '추가' }));
  expect(onAdd).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm test -- AddProjectModal
```

Expected: FAIL — `Cannot find module './AddProjectModal'`

- [ ] **Step 3: Create `frontend/src/components/AddProjectModal.jsx`**

```jsx
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- AddProjectModal
```

Expected:
```
✓ src/components/AddProjectModal.test.jsx (3 tests)
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/AddProjectModal.jsx frontend/src/components/AddProjectModal.test.jsx
git commit -m "feat: AddProjectModal component"
```

---

### Task 9: App root + styles

**Files:**
- Modify: `frontend/src/App.jsx`
- Create: `frontend/src/App.css`

- [ ] **Step 1: Replace `frontend/src/App.jsx`**

```jsx
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
```

- [ ] **Step 2: Create `frontend/src/App.css`**

```css
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f5f5f5;
  color: #333;
}

.app { max-width: 1200px; margin: 0 auto; padding: 24px; }

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

header h1 { font-size: 1.4rem; font-weight: 600; }

.header-actions { display: flex; gap: 8px; }

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.project-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 { font-size: 1rem; font-weight: 600; }

.card-meta { font-size: 0.8rem; color: #888; }

.instructions { list-style: none; display: flex; flex-direction: column; gap: 6px; }

.instructions li { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; }

.instructions li span.done { text-decoration: line-through; color: #bbb; }

.instructions li button {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  color: #ccc;
  font-size: 0.75rem;
  padding: 2px 4px;
}

.instructions li button:hover { color: #e53935; }

.add-instruction { display: flex; gap: 4px; }

.add-instruction input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85rem;
}

.progress { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; }

.progress-bar {
  flex: 1;
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4CAF50;
  border-radius: 4px;
  transition: width 0.3s;
}

.no-progress { font-size: 0.8rem; color: #bbb; }

.card-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }

button {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  background: white;
  font-size: 0.85rem;
}

button:hover:not(:disabled) { background: #f0f0f0; }

button:disabled { opacity: 0.5; cursor: default; }

button.danger { color: #e53935; border-color: #e53935; }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 420px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal h2 { font-size: 1.1rem; }

.modal label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
  color: #555;
}

.modal input {
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }

select {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.8rem;
  background: white;
  cursor: pointer;
}

.empty {
  color: #aaa;
  text-align: center;
  padding: 60px;
  grid-column: 1 / -1;
}
```

- [ ] **Step 3: Run all frontend tests**

```bash
cd frontend && npm test
```

Expected:
```
✓ src/components/ProjectCard.test.jsx (7 tests)
✓ src/components/AddProjectModal.test.jsx (3 tests)
Test Files: 2 passed
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.jsx frontend/src/App.css
git commit -m "feat: App root component and styles"
```

---

### Task 10: Integration smoke test

**Files:** none new

- [ ] **Step 1: Start backend**

```bash
cd backend && node server.js
```

Expected: `Server running on http://localhost:3001`

Leave running. Open a second terminal.

- [ ] **Step 2: Start frontend**

```bash
cd frontend && npm run dev
```

Expected: `Local: http://localhost:5173/`

- [ ] **Step 3: Open browser at http://localhost:5173**

Verify:
- "KPM 프로젝트 비서" header visible
- "새로고침" and "+ 추가" buttons visible
- Empty state message visible

- [ ] **Step 4: Add a real project**

Click "+ 추가" → enter name `SquadVsMonster` → enter the actual path (e.g. `C:/Users/오진우/OneDrive - 스토익엔터테인먼트/바탕 화면/게임개발/SquadVsMonster`) → click "추가"

Verify: project card appears with name, "총 0건", and progress bar (or "plan 파일 없음" if no plan files yet)

- [ ] **Step 5: Add an instruction**

Type in the instruction input → press Enter

Verify: instruction appears in the checklist, count updates to "총 1건", last instruction time shows current time

- [ ] **Step 6: Test VSCode open**

Click "열기" button

Verify: VSCode opens with the project folder (requires `code` to be in PATH)

- [ ] **Step 7: Final commit**

```bash
git add .
git commit -m "feat: KPM dashboard complete"
```

---

## Running the App

Each time you want to use the dashboard, run these two commands in separate terminals from the `0_KPM` directory:

```bash
# Terminal 1
cd backend && node server.js

# Terminal 2
cd frontend && npm run dev
```

Then open http://localhost:5173
