const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from .env file
dotenv.config();

// Create an instance of Express
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Import routes
const dashboardRoutes = require("./routes/dashboard");
const authRoutes = require("./routes/auth");
const usuariosRoutes = require("./routes/usuarios");
const localidadesRoutes = require("./routes/localidades");
const senhasRoutes = require("./routes/senhas");

// Import auth middleware
const authenticate = require('./middleware/auth');

// Use routes BEFORE static files
app.use("/dashboard", dashboardRoutes);
app.use("/auth", authRoutes);

// Apply authentication middleware to protected routes
app.use("/usuarios", authenticate, usuariosRoutes);
app.use("/localidades", authenticate, localidadesRoutes);
app.use("/senhas", authenticate, senhasRoutes);

// Define specific routes BEFORE static middleware
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Serve static files from public directory AFTER specific routes
app.use(express.static("public"));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

// Define the port from environment variables or default to 3000
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});