require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const User = require("./models/user");
const Cost = require("./models/cost");
const userRoutes = require('./routes/userRoutes');
const costRoutes = require('./routes/costRoutes');
const aboutRoutes = require('./routes/aboutRoutes');

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

/**
 * Ensure MONGO_URI is set in .env
 */
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("[Index] MONGO_URI not found in .env");
  process.exit(1);
}

/**
 * @description Mount API routes
 */
app.use('/api', userRoutes);
app.use('/api', costRoutes);
app.use('/api', aboutRoutes);


/**
 * Connect to MongoDB (using Mongoose) and start the server
 */
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("[Index] Connected to MongoDB successfully");
    app.listen(PORT, () => {
      console.log(`[Index] Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[Index] MongoDB connection error:", err.message);
    process.exit(1);
  });
