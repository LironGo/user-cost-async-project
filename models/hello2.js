const mongoose = require("mongoose");

/**
 * @fileoverview Defines the Cost schema and model.
 */

/**
 * @typedef {Object} Cost
 * @property {String} description - Brief description of the expense.
 * @property {String} category - One of: 'food', 'health', 'housing', 'sport', 'education'.
 * @property {Number} userid - Numeric ID of the user who incurred this cost.
 * @property {Number} sum - Amount of the expense.
 * @property {Date} createdAt - Timestamp when the cost was created.
 */

/** @type {mongoose.Schema<Cost>} */
const costSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["food", "health", "housing", "sport", "education"],
    required: true,
  },
  userid: {
    type: Number,
    required: true,
    ref: "User",
  },
  sum: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/** @type {mongoose.Model<Cost>} */
module.exports = mongoose.model("Cost", costSchema);
