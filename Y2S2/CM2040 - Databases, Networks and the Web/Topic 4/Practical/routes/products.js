const express = require('express');
const router = express.Router();

// Example product data (in a real app, this would be from a database)
const products = [
  { id: 1, name: 'Product A', price: 10.00 },
  { id: 2, name: 'Product B', price: 20.00 }
];

// Define product-related routes
// GET all products as raw text
router.get('/', (req, res) => {
    res.send('List of products: Product A, Product B'); // Raw text response
});

// GET all products in JSON format
router.get('/json', (req, res) => {
    res.json(products); // JSON format
});

// POST a new product and return in JSON format
router.post('/', (req, res) => {
    const newProduct = req.body; // Expect the new product data in the request body
    products.push(newProduct); // Add the new product to the array
    res.status(201).json(newProduct); // Respond with the newly created product in JSON format
});

module.exports = router;
