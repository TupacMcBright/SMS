const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Form 1A", "Form 2B"
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }, // Class teacher
  academic_year: { type: String, required: true }, // e.g., "2023-2024"
  capacity: { type: Number, default: 40 },
  description: { type: String },
  created_at: { type: Date, default: Date.now }
});

// Compound unique index for name + academic_year
classSchema.index({ name: 1, academic_year: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema); 