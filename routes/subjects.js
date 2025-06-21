const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');

// POST /api/subjects — Add a new subject
router.post('/', async (req, res) => {
  try {
    const { name, code } = req.body;
    
    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({ 
        error: 'Subject name and code are required' 
      });
    }
    
    // Check if subject name or code already exists
    const existingSubject = await Subject.findOne({
      $or: [{ name: name }, { code: code }]
    });
    
    if (existingSubject) {
      return res.status(400).json({ 
        error: 'Subject with this name or code already exists' 
      });
    }
    
    const subject = new Subject(req.body);
    await subject.save();
    
    res.status(201).json(subject);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/subjects — List all subjects
router.get('/', async (req, res) => {
  try {
    const subjects = await Subject.find({ is_active: true });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/subjects/:id — Get a specific subject
router.get('/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.json(subject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/subjects/:id — Update subject info
router.put('/:id', async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.json(subject);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/subjects/:id — Delete a subject (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { is_active: false },
      { new: true }
    );
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.json({ message: 'Subject deactivated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 