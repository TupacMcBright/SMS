const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  class_name: { type: String, required: true },
  trimester: { type: String, required: true, enum: ['First', 'Second', 'Third'] },
  academic_year: { type: String, required: true },
  total_subjects: { type: Number, required: true },
  total_coefficient: { type: Number, required: true },
  total_score: { type: Number, required: true },
  average: { type: Number, required: true },
  class_position: { type: Number },
  total_students: { type: Number },
  remarks: { type: String },
  grade: { type: String }, // A, B, C, D, E, F
  decision: { type: String, enum: ['Pass', 'Fail', 'Repeat'] },
  generated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  generated_at: { type: Date, default: Date.now }
});

// Compound index to prevent duplicate results
resultSchema.index({ 
  student_id: 1, 
  trimester: 1, 
  academic_year: 1 
}, { unique: true });

module.exports = mongoose.model('Result', resultSchema); 