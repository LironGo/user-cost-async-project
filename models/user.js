const mongoose = require('mongoose');

/**
 * @fileoverview Defines the User schema and model.
 */

/**
 * @typedef {Object} User
 * @property {Number} id - Unique numeric identifier for a user.
 * @property {String} first_name - First name of the user.
 * @property {String} last_name - Last name of the user.
 * @property {Date} birthday - User's birth date.
 * @property {String} marital_status - One of: 'single', 'married', 'divorced', 'widowed'.
 */

/** @type {mongoose.Schema<User>} */
const userSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  first_name: {
    type: String,
    required: true,
    trim: true
  },
  last_name: {
    type: String,
    required: true,
    trim: true
  },
  birthday: {
    type: Date,
    required: true
  },
  marital_status: {
    type: String,
    enum: ['single', 'married', 'divorced', 'widowed'],
    required: true
  }
});

/** @type {mongoose.Model<User>} */
module.exports = mongoose.model('User', userSchema);
