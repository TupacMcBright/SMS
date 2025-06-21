const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

// POST /api/classes — Create a new class
router.post('/', async (req, res) => {
  try {
    const { name, teacher_id, academic_year } = req.body;
    
    // Validate required fields
    if (!name || !academic_year) {
      return res.status(400).json({ 
        error: 'Class name and academic year are required' 
      });
    }
    
    // Check if class name already exists
    const existingClass = await Class.findOne({ name, academic_year });
    if (existingClass) {
      return res.status(400).json({ error: 'Class with this name already exists for this academic year' });
    }
    
    // If teacher_id is provided, verify teacher exists
    if (teacher_id) {
      const teacher = await Teacher.findById(teacher_id);
      if (!teacher) {
        return res.status(400).json({ error: 'Teacher not found' });
      }
    }
    
    const newClass = new Class(req.body);
    await newClass.save();
    
    res.status(201).json(newClass);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/classes — List all classes
router.get('/', async (req, res) => {
  try {
    const classes = await Class.find().populate('teacher_id', 'first_name last_name subject');
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/classes/:id — Get a specific class with students
router.get('/:id', async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id).populate('teacher_id', 'first_name last_name subject');
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    // Get students in this class
    const students = await Student.find({ class_name: classData.name });
    
    res.json({
      class: classData,
      students: students,
      studentCount: students.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/classes/:id — Update class info
router.put('/:id', async (req, res) => {
  try {
    const classData = await Class.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.json(classData);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/classes/:id — Delete a class
router.delete('/:id', async (req, res) => {
  try {
    const classData = await Class.findByIdAndDelete(req.params.id);
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.json({ message: 'Class deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/classes/:id/assign-teacher — Assign teacher to class
router.post('/:id/assign-teacher', async (req, res) => {
  try {
    const { teacher_id } = req.body;
    
    if (!teacher_id) {
      return res.status(400).json({ error: 'Teacher ID is required' });
    }
    
    // Verify teacher exists
    const teacher = await Teacher.findById(teacher_id);
    if (!teacher) {
      return res.status(400).json({ error: 'Teacher not found' });
    }
    
    const classData = await Class.findByIdAndUpdate(
      req.params.id,
      { teacher_id: teacher_id },
      { new: true }
    ).populate('teacher_id', 'first_name last_name subject');
    
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    res.json(classData);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/classes/:id/students — Get students in a class
router.get('/:id/students', async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    const students = await Student.find({ class_name: classData.name });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 