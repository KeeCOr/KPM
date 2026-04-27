const fs = require('fs').promises;
const path = require('path');

async function getMarkdownFiles(dir) {
  try {
    const files = await fs.readdir(dir);
    return files
      .filter(f => f.endsWith('.md'))
      .map(f => path.join(dir, f));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
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
