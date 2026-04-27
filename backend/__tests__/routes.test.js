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
