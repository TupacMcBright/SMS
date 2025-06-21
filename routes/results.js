const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Mark = require('../models/Mark');
const Student = require('../models/Student');
const Subject = require('../models/Subject');

// Helper function to calculate grade based on average
function calculateGrade(average) {
  if (average >= 16) return 'A';
  if (average >= 14) return 'B';
  if (average >= 12) return 'C';
  if (average >= 10) return 'D';
  if (average >= 8) return 'E';
  return 'F';
}

// Helper function to determine decision
function calculateDecision(average) {
  if (average >= 10) return 'Pass';
  if (average >= 8) return 'Repeat';
  return 'Fail';
}

// Helper function to generate remarks
function generateRemarks(average) {
  if (average >= 16) return 'Excellent! Keep up the good work.';
  if (average >= 14) return 'Very good performance.';
  if (average >= 12) return 'Good work, but room for improvement.';
  if (average >= 10) return 'Satisfactory. Work harder next time.';
  if (average >= 8) return 'Below average. Need to improve significantly.';
  return 'Poor performance. Immediate attention required.';
}

// POST /api/results/generate/:studentId — Generate result for a student
router.post('/generate/:studentId', async (req, res) => {
  try {
    const { trimester, academic_year } = req.body;
    
    if (!trimester || !academic_year) {
      return res.status(400).json({ error: 'Trimester and academic year are required' });
    }
    
    // Check if result already exists
    const existingResult = await Result.findOne({
      student_id: req.params.studentId,
      trimester,
      academic_year
    });
    
    if (existingResult) {
      return res.status(400).json({ error: 'Result already exists for this student, trimester, and academic year' });
    }
    
    // Get student info
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Get all marks for the student
    const marks = await Mark.find({
      student_id: req.params.studentId,
      trimester,
      academic_year
    }).populate('subject_id', 'coefficient');
    
    if (marks.length === 0) {
      return res.status(400).json({ error: 'No marks found for this student' });
    }
    
    // Calculate totals
    let totalScore = 0;
    let totalCoefficient = 0;
    
    marks.forEach(mark => {
      const coefficient = mark.subject_id.coefficient || 1;
      totalScore += mark.score * coefficient;
      totalCoefficient += coefficient;
    });
    
    const average = totalScore / totalCoefficient;
    const grade = calculateGrade(average);
    const decision = calculateDecision(average);
    const remarks = generateRemarks(average);
    
    // Create result
    const result = new Result({
      student_id: req.params.studentId,
      class_name: student.class_name,
      trimester,
      academic_year,
      total_subjects: marks.length,
      total_coefficient,
      total_score: totalScore,
      average: Math.round(average * 100) / 100,
      grade,
      decision,
      remarks
    });
    
    await result.save();
    
    // Populate student info for response
    await result.populate('student_id', 'first_name last_name');
    
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/results/generate-class/:className — Generate results for entire class
router.post('/generate-class/:className', async (req, res) => {
  try {
    const { trimester, academic_year } = req.body;
    
    if (!trimester || !academic_year) {
      return res.status(400).json({ error: 'Trimester and academic year are required' });
    }
    
    // Get all students in the class
    const students = await Student.find({ class_name: req.params.className });
    
    if (students.length === 0) {
      return res.status(404).json({ error: 'No students found in this class' });
    }
    
    const results = [];
    
    // Generate results for each student
    for (const student of students) {
      // Check if result already exists
      const existingResult = await Result.findOne({
        student_id: student._id,
        trimester,
        academic_year
      });
      
      if (existingResult) {
        results.push(existingResult);
        continue;
      }
      
      // Get marks for this student
      const marks = await Mark.find({
        student_id: student._id,
        trimester,
        academic_year
      }).populate('subject_id', 'coefficient');
      
      if (marks.length === 0) continue;
      
      // Calculate totals
      let totalScore = 0;
      let totalCoefficient = 0;
      
      marks.forEach(mark => {
        const coefficient = mark.subject_id.coefficient || 1;
        totalScore += mark.score * coefficient;
        totalCoefficient += coefficient;
      });
      
      const average = totalScore / totalCoefficient;
      const grade = calculateGrade(average);
      const decision = calculateDecision(average);
      const remarks = generateRemarks(average);
      
      // Create result
      const result = new Result({
        student_id: student._id,
        class_name: student.class_name,
        trimester,
        academic_year,
        total_subjects: marks.length,
        total_coefficient,
        total_score: totalScore,
        average: Math.round(average * 100) / 100,
        grade,
        decision,
        remarks
      });
      
      await result.save();
      results.push(result);
    }
    
    // Calculate class positions
    const classResults = results.filter(r => r.class_name === req.params.className);
    classResults.sort((a, b) => b.average - a.average);
    
    for (let i = 0; i < classResults.length; i++) {
      classResults[i].class_position = i + 1;
      classResults[i].total_students = classResults.length;
      await classResults[i].save();
    }
    
    // Populate student info for response
    for (const result of classResults) {
      await result.populate('student_id', 'first_name last_name');
    }
    
    res.json({
      message: `Generated results for ${classResults.length} students`,
      results: classResults
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/results/student/:studentId — Get results for a student
router.get('/student/:studentId', async (req, res) => {
  try {
    const { trimester, academic_year } = req.query;
    const query = { student_id: req.params.studentId };
    
    if (trimester) query.trimester = trimester;
    if (academic_year) query.academic_year = academic_year;
    
    const results = await Result.find(query)
      .populate('student_id', 'first_name last_name class_name')
      .sort({ academic_year: -1, trimester: 1 });
    
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/results/class/:className — Get results for a class
router.get('/class/:className', async (req, res) => {
  try {
    const { trimester, academic_year } = req.query;
    const query = { class_name: req.params.className };
    
    if (trimester) query.trimester = trimester;
    if (academic_year) query.academic_year = academic_year;
    
    const results = await Result.find(query)
      .populate('student_id', 'first_name last_name')
      .sort({ class_position: 1 });
    
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/results/:id — Get a specific result
router.get('/:id', async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('student_id', 'first_name last_name class_name')
      .populate('generated_by', 'first_name last_name');
    
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 