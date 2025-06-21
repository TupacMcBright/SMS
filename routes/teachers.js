const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Teacher = require('../models/Teacher');
const User = require('../models/User');

// POST /api/teachers — Register a new teacher
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, subject, contact, email } = req.body;
    
    // Validate required fields
    if (!first_name || !last_name || !subject || !contact || !email) {
      return res.status(400).json({ 
        error: 'All fields are required: first_name, last_name, subject, contact, email' 
      });
    }
    
    const teacher = new Teacher(req.body);
    await teacher.save();
    
    // Create a user account for the teacher
    const defaultPassword = 'teacher123'; // Default password
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    const username = `${first_name.toLowerCase()}${last_name.toLowerCase()}${teacher._id.toString().slice(-4)}`;
    
    const user = new User({
      username: username,
      password: hashedPassword,
      role: 'teacher',
      related_id: teacher._id
    });
    
    await user.save();
    
    res.status(201).json({
      teacher: teacher,
      loginCredentials: {
        username: username,
        password: defaultPassword,
        message: 'Teacher registered successfully. Default password is "teacher123". Please change it after first login.'
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/teachers — List all teachers
router.get('/', async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/teachers/:id — Get a specific teacher
router.get('/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    res.json(teacher);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/teachers/:id — Update teacher info
router.put('/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    res.json(teacher);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/teachers/:id — Delete a teacher
router.delete('/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    // Also delete the associated user account
    await User.findOneAndDelete({ role: 'teacher', related_id: req.params.id });
    
    res.json({ message: 'Teacher deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 