const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  class_name: { type: String, required: true }, // e.g., "Form 1A"
  trimester: { type: String, required: true, enum: ['First', 'Second', 'Third'] },
  academic_year: { type: String, required: true }, // e.g., "2023-2024"
  score: { type: Number, required: true, min: 0, max: 20 }, // Cameroonian grading system (0-20)
  total_score: { type: Number, default: 20 }, // Usually 20, but can be different
  coefficient: { type: Number, default: 1 }, // Subject coefficient
  remarks: { type: String },
  entered_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  entered_at: { type: Date, default: Date.now }
});

// Compound index to prevent duplicate marks
markSchema.index({ 
  student_id: 1, 
  subject_id: 1, 
  trimester: 1, 
  academic_year: 1 
}, { unique: true });

module.exports = mongoose.model('Mark', markSchema); 