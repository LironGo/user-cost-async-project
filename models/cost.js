const mongoose = require('mongoose');

const costSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['food', 'health', 'housing', 'sport', 'education'],
    required: true
  },
  userid: {
    type: Number,
    required: true,
    ref: 'User'
  },
  sum: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Cost', costSchema);
