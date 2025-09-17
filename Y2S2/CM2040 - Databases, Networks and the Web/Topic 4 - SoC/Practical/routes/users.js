const express = require('express');
const router = express.Router();

// Example user data (in a real app, this would be from a database)
const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];

// Define user-related routes
// GET all users as raw text
router.get('/', (req, res) => {
    res.send('List of users: John Doe, Jane Smith'); // Raw text response
});

// GET all users in JSON format
router.get('/json', (req, res) => {
    res.json(users); // JSON format
});

// POST a new user and return in JSON format
router.post('/', (req, res) => {
    const newUser = req.body; // Expect the new user data in the request body
    users.push(newUser); // Add the new user to the array
    res.status(201).json(newUser); // Respond with the newly created user in JSON format
});

module.exports = router;
