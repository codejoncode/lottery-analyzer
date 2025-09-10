const express = require('express');
const cors = require('cors');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/api/powerball', (req, res) => {
  const results = [];
  const filePath = path.join(__dirname, '../frontend/src/components/powerball.txt');
  
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
      // Parse white_balls
      data.white_balls = data.white_balls.split('|').map(Number);
      data.red_ball = Number(data.red_ball);
      results.push(data);
    })
    .on('end', () => {
      // Sort from latest to oldest
      results.sort((a, b) => new Date(b.date) - new Date(a.date));
      res.json(results);
    })
    .on('error', (err) => {
      res.status(500).json({ error: 'Error reading CSV file' });
    });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
