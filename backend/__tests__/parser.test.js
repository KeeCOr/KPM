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
