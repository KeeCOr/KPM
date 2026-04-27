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
