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
