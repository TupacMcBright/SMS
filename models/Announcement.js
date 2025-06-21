const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  target_role: { 
    type: String, 
    required: true, 
    enum: ['all', 'admin', 'teacher', 'student', 'parent'] 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  is_active: { type: Boolean, default: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  expires_at: { type: Date }, // Optional expiration date
  attachments: [{ 
    filename: String, 
    url: String 
  }]
});

module.exports = mongoose.model('Announcement', announcementSchema); 