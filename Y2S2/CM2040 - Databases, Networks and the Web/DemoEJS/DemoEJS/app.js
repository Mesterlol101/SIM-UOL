const express = require('express');
const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));

// Simulate login status (toggle this for testing)
const isLoggedIn = true;

const data = {
  title: "EJS Demo",
  isLoggedIn: false,
  username: "chat_user",
  items: false
    ? ["Mango", "Pineapple", "Strawberry"] // Logged in user's list
    : ["Apple", "Banana", "Cherry"]        // Guest user's list
};

app.get('/', (req, res) => {
  res.render('index', data);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
