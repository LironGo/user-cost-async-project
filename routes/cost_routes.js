const express = require("express");
const router = express.Router();

const Cost = require("../models/Cost");

/**
 * @route   POST /api/add
 * @desc    Add a new cost item.
 * @body    {String} description - Description of the cost.
 * @body    {String} category - Category of the cost (must be one of: 'food', 'health', 'housing', 'sport', 'education').
 * @body    {Number} userid - ID of the user incurring the cost.
 * @body    {Number} sum - Amount of the cost.
 * @return  {Object} The newly created cost item in JSON format, or an error object.
 */
router.post("/add", async (req, res) => {
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
router.get("/report", async (req, res) => {
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

module.exports = router;
