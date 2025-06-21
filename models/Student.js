const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  date_of_birth: { type: Date, required: true },
  gender: { type: String, required: true },
  class_name: { type: String, required: true },
  parent_contact: { type: String, required: true },
  address: { type: String },
  registration_date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', studentSchema); 