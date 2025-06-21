const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g., "Mathematics", "English"
  code: { type: String, required: true, unique: true }, // e.g., "MATH", "ENG"
  description: { type: String },
  credits: { type: Number, default: 1 },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Subject', subjectSchema); 