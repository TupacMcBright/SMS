const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'teacher', 'student', 'parent'], required: true },
  related_id: { type: mongoose.Schema.Types.ObjectId, refPath: 'role' }
});

module.exports = mongoose.model('User', userSchema); 