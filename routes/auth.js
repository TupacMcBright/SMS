const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, password, role, related_id } = req.body;
    
    // Validate required fields
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role are required' });
    }
    
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: 'Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, role, related_id });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      'your_jwt_secret', // Use a strong secret in production!
      { expiresIn: '1d' }
    );
    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student Login (using student ID or registration number)
router.post('/student-login', async (req, res) => {
  try {
    const { studentId, password } = req.body;
    
    // Validate required fields
    if (!studentId || !password) {
      return res.status(400).json({ error: 'Student ID and password are required' });
    }
    
    // Find student by ID
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(400).json({ error: 'Student not found' });
    }
    
    // Find user account linked to this student
    const user = await User.findOne({ 
      role: 'student', 
      related_id: studentId 
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Student account not found. Please contact administrator.' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid password' });

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role, 
        studentId: studentId 
      },
      'your_jwt_secret',
      { expiresIn: '1d' }
    );
    
    res.json({ 
      token, 
      role: user.role,
      student: {
        id: student._id,
        name: `${student.first_name} ${student.last_name}`,
        class: student.class_name
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 