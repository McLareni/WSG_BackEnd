const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

// Import routes
const register = require("./auth/register");
const login = require("./auth/login");
const refresh = require("./auth/refresh");

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.post("/register", register);
app.post("/login", login);
app.post("/refresh", refresh);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
