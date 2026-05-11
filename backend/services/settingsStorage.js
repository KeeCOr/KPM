const fs = require('fs').promises;
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '../../settings.json');
const DEFAULT_SETTINGS = { globalRules: [] };

async function readSettings() {
  try {
    const raw = await fs.readFile(SETTINGS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return { ...DEFAULT_SETTINGS };
    throw err;
  }
}

async function writeSettings(data) {
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { readSettings, writeSettings };
