require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const User = require("./models/User");
const Cost = require("./models/Cost");

const userRoutes = require("./routes/user_routes");
const costRoutes = require("./routes/cost_routes");
const aboutRoutes = require("./routes/about_routes");

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

/**
 * @description Mount API routes
 */
app.use("/api", userRoutes);
app.use("/api", costRoutes);
app.use("/api", aboutRoutes);

/**
 * Ensure MONGO_URI is set in .env
 */
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("[Index] MONGO_URI not found in .env");
  process.exit(1);
}

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

module.exports = app;
