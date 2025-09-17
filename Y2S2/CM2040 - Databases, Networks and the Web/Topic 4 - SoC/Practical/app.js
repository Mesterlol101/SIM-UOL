const express = require('express');
const app = express();
const usersRoutes = require('./routes/users');
const productsRoutes = require('./routes/products');

// Middleware to handle JSON body
app.use(express.json()); // Automatically parse JSON in the body of incoming requests

// Use the modular routes
app.use('/users', usersRoutes);
app.use('/products', productsRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
