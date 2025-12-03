// Imports
import express from 'express';

// Create Express app
const app = express();

// Configuration
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

// Lancer un serveur HTTP
const port = 3000;
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
