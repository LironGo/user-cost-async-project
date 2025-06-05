require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const app = express();
const PORT = 3000;

// Get Mongo URI from environment
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("[Index] MONGO_URI not found in .env");
  process.exit(1);
}

// Connect to MongoDB (no deprecated options)
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("[Index] Connected to MongoDB successfully");
    // Start the server only after DB connection is established
    app.listen(PORT, () => {
      console.log(`[Index] Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[Index] MongoDB connection error:", err.message);
    process.exit(1);
  });
