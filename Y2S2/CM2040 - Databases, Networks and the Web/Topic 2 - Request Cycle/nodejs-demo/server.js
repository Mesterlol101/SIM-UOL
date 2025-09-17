// server.js
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing middleware for form data
app.use(express.urlencoded({ extended: true }));

// Route to handle form submissions
app.post('/submit', (req, res) => {
  const { name, message } = req.body;
  res.send(`<h1>Thank you, ${name}!</h1><p>Your message: "${message}" has been received.</p>`);
});

// Simple route to render the home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
