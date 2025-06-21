const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const User = require('../models/User');

// POST /api/students — Register a new student
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, date_of_birth, gender, class_name, parent_contact } = req.body;
    
    // Validate required fields
    if (!first_name || !last_name || !date_of_birth || !gender || !class_name || !parent_contact) {
      return res.status(400).json({ 
        error: 'All fields are required: first_name, last_name, date_of_birth, gender, class_name, parent_contact' 
      });
    }
    
    const student = new Student(req.body);
    await student.save();
    
    // Create a user account for the student
    const defaultPassword = 'student123'; // Default password
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    const username = `${first_name.toLowerCase()}${last_name.toLowerCase()}${student._id.toString().slice(-4)}`;
    
    const user = new User({
      username: username,
      password: hashedPassword,
      role: 'student',
      related_id: student._id
    });
    
    await user.save();
    
    res.status(201).json({
      student: student,
      loginCredentials: {
        username: username,
        password: defaultPassword,
        message: 'Student registered successfully. Default password is "student123". Please change it after first login.'
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/students — List all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/students/:id — Get a specific student
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 