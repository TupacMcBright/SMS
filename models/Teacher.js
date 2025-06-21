const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  subject: { type: String, required: true },
  contact: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String },
  hire_date: { type: Date, default: Date.now },
  qualification: { type: String },
  salary: { type: Number }
});

module.exports = mongoose.model('Teacher', teacherSchema); 