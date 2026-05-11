const express = require('express');
const { readSettings, writeSettings } = require('../services/settingsStorage');

const router = express.Router();

router.get('/', async (req, res) => {
  const settings = await readSettings();
  res.json(settings);
});

router.put('/', async (req, res) => {
  const current = await readSettings();
  const updated = { ...current, ...req.body };
  await writeSettings(updated);
  res.json(updated);
});

module.exports = router;
