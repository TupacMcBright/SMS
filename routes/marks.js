const express = require('express');
const router = express.Router();
const Mark = require('../models/Mark');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');

// POST /api/marks — Add marks for a student
router.post('/', async (req, res) => {
  try {
    const { student_id, subject_id, class_name, trimester, academic_year, score, coefficient } = req.body;
    
    // Validate required fields
    if (!student_id || !subject_id || !class_name || !trimester || !academic_year || score === undefined) {
      return res.status(400).json({ 
        error: 'All fields are required: student_id, subject_id, class_name, trimester, academic_year, score' 
      });
    }
    
    // Validate score range (0-20)
    if (score < 0 || score > 20) {
      return res.status(400).json({ error: 'Score must be between 0 and 20' });
    }
    
    // Check if student exists
    const student = await Student.findById(student_id);
    if (!student) {
      return res.status(400).json({ error: 'Student not found' });
    }
    
    // Check if subject exists
    const subject = await Subject.findById(subject_id);
    if (!subject) {
      return res.status(400).json({ error: 'Subject not found' });
    }
    
    // Check if mark already exists for this student, subject, trimester, and year
    const existingMark = await Mark.findOne({
      student_id,
      subject_id,
      trimester,
      academic_year
    });
    
    if (existingMark) {
      return res.status(400).json({ 
        error: 'Mark already exists for this student, subject, trimester, and academic year' 
      });
    }
    
    const mark = new Mark({
      ...req.body,
      coefficient: coefficient || 1
    });
    
    await mark.save();
    
    // Populate references for response
    await mark.populate('student_id', 'first_name last_name');
    await mark.populate('subject_id', 'name code');
    
    res.status(201).json(mark);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/marks/student/:studentId — Get all marks for a student
router.get('/student/:studentId', async (req, res) => {
  try {
    const { trimester, academic_year } = req.query;
    const query = { student_id: req.params.studentId };
    
    if (trimester) query.trimester = trimester;
    if (academic_year) query.academic_year = academic_year;
    
    const marks = await Mark.find(query)
      .populate('student_id', 'first_name last_name class_name')
      .populate('subject_id', 'name code coefficient')
      .populate('entered_by', 'first_name last_name');
    
    res.json(marks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/marks/class/:className — Get marks for all students in a class
router.get('/class/:className', async (req, res) => {
  try {
    const { trimester, academic_year } = req.query;
    const query = { class_name: req.params.className };
    
    if (trimester) query.trimester = trimester;
    if (academic_year) query.academic_year = academic_year;
    
    const marks = await Mark.find(query)
      .populate('student_id', 'first_name last_name')
      .populate('subject_id', 'name code coefficient')
      .populate('entered_by', 'first_name last_name');
    
    res.json(marks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/marks/:id — Update a mark
router.put('/:id', async (req, res) => {
  try {
    const { score } = req.body;
    
    if (score !== undefined && (score < 0 || score > 20)) {
      return res.status(400).json({ error: 'Score must be between 0 and 20' });
    }
    
    const mark = await Mark.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('student_id', 'first_name last_name')
     .populate('subject_id', 'name code');
    
    if (!mark) {
      return res.status(404).json({ error: 'Mark not found' });
    }
    
    res.json(mark);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/marks/:id — Delete a mark
router.delete('/:id', async (req, res) => {
  try {
    const mark = await Mark.findByIdAndDelete(req.params.id);
    if (!mark) {
      return res.status(404).json({ error: 'Mark not found' });
    }
    res.json({ message: 'Mark deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/marks/calculate-average/:studentId — Calculate student average
router.get('/calculate-average/:studentId', async (req, res) => {
  try {
    const { trimester, academic_year } = req.query;
    
    if (!trimester || !academic_year) {
      return res.status(400).json({ error: 'Trimester and academic year are required' });
    }
    
    const marks = await Mark.find({
      student_id: req.params.studentId,
      trimester,
      academic_year
    }).populate('subject_id', 'coefficient');
    
    if (marks.length === 0) {
      return res.status(404).json({ error: 'No marks found for this student' });
    }
    
    let totalWeightedScore = 0;
    let totalCoefficient = 0;
    
    marks.forEach(mark => {
      const coefficient = mark.subject_id.coefficient || 1;
      totalWeightedScore += mark.score * coefficient;
      totalCoefficient += coefficient;
    });
    
    const average = totalWeightedScore / totalCoefficient;
    
    res.json({
      student_id: req.params.studentId,
      trimester,
      academic_year,
      average: Math.round(average * 100) / 100, // Round to 2 decimal places
      total_marks: marks.length,
      total_coefficient: totalCoefficient
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 