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
