require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const User = require("./models/user");
const Cost = require("./models/cost");

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

/**
 * @route   POST /api/add
 * @desc    Add a new cost item.
 * @body    {String} description - Description of the cost.
 * @body    {String} category - Category of the cost (must be one of: 'food', 'health', 'housing', 'sport', 'education').
 * @body    {Number} userid - ID of the user incurring the cost.
 * @body    {Number} sum - Amount of the cost.
 * @return  {Object} The newly created cost item in JSON format, or an error object.
 */
app.post("/api/add", async (req, res) => {
  try {
    const { description, category, userid, sum } = req.body;

    // Create new Cost document
    const newCost = new Cost({
      description,
      category,
      userid,
      sum,
    });

    const savedCost = await newCost.save();
    return res.status(201).json(savedCost);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/**
 * @route   GET /api/report
 * @desc    Get a monthly report of cost items for a given user, grouped by category.
 * @query   {Number} id - User ID to filter by.
 * @query   {Number} year - Year (e.g., 2025) to filter by.
 * @query   {Number} month - Month (1–12) to filter by.
 * @return  {Object} JSON document:
 *           {
 *             userid: <Number>,
 *             year:   <Number>,
 *             month:  <Number>,
 *             costs: [
 *               { food: [ { sum, description, day }, … ] },
 *               { health: [ … ] },
 *               { housing: [ … ] },
 *               { sport: [ … ] },
 *               { education: [ … ] }
 *             ]
 *           }
 *         Or an error object.
 */
app.get("/api/report", async (req, res) => {
  try {
    const id = parseInt(req.query.id, 10);
    const year = parseInt(req.query.year, 10);
    const month = parseInt(req.query.month, 10);

    if (Number.isNaN(id) || Number.isNaN(year) || Number.isNaN(month)) {
      return res
        .status(400)
        .json({ error: "Invalid id, year, or month parameter." });
    }

    // Compute date range: from start of given month to start of next month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // Find all costs matching userid and createdAt within [startDate, endDate)
    const allCosts = await Cost.find({
      userid: id,
      createdAt: { $gte: startDate, $lt: endDate },
    }).lean();

    // Initialize an object with empty arrays for each category
    const categories = ["food", "health", "housing", "sport", "education"];
    const grouped = {};
    categories.forEach((cat) => {
      grouped[cat] = [];
    });

    // Populate grouping
    allCosts.forEach((c) => {
      const dayOfMonth = c.createdAt.getUTCDate();
      grouped[c.category].push({
        sum: c.sum,
        description: c.description,
        day: dayOfMonth,
      });
    });

    // Build the costs array in the required format
    const costsArray = categories.map((cat) => {
      return { [cat]: grouped[cat] };
    });

    return res.json({
      userid: id,
      year: year,
      month: month,
      costs: costsArray,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get details of a specific user (first_name, last_name, id, total cost sum).
 * @param   {Number} id - The user ID in the URL path.
 * @return  {Object} JSON:
 *           {
 *             id:         <Number>,
 *             first_name: <String>,
 *             last_name:  <String>,
 *             total:      <Number>
 *           }
 *         Or an error object.
 */
app.get("/api/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID." });
    }

    // Find the user document
    const userDoc = await User.findOne({ id }).lean();
    if (!userDoc) {
      return res.status(404).json({ error: "User not found." });
    }

    // Sum up all costs for this user
    const userCosts = await Cost.find({ userid: id }).lean();
    const totalSum = userCosts.reduce((sum, cost) => sum + cost.sum, 0);

    return res.json({
      id: userDoc.id,
      first_name: userDoc.first_name,
      last_name: userDoc.last_name,
      total: totalSum,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/about
 * @desc    Get a JSON document listing all team members (hardcoded). Fill in personal details.
 * @return  {Array<Object>} e.g. [ {id: 'ID', first_name: 'First', last_name: 'Last', birthday: 'DD/MM/YYYY', marital_status:'single/married/divorced/widowed' }, { … } ]
 */
app.get("/api/about", (req, res) => {
  const team = [
    {
      id: "208995068",
      first_name: "Liron",
      last_name: "Golan",
      birthday: "03/06/1997",
      marital_status: "single",
    },
    {
      id: "206845570",
      first_name: "Paz",
      last_name: "Elisha",
      birthday: "04/10/1998",
      marital_status: "single",
    },
  ];

  return res.json(team);
});

module.exports = app;
