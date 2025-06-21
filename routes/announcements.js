const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

// POST /api/announcements — Create an announcement
router.post('/', async (req, res) => {
  try {
    const { title, message, target_role, priority } = req.body;
    
    // Validate required fields
    if (!title || !message || !target_role) {
      return res.status(400).json({ 
        error: 'Title, message, and target role are required' 
      });
    }
    
    const announcement = new Announcement({
      ...req.body,
      created_by: req.user?.userId // From auth middleware
    });
    
    await announcement.save();
    
    res.status(201).json(announcement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/announcements — List all announcements (with filters)
router.get('/', async (req, res) => {
  try {
    const { target_role, priority, is_active } = req.query;
    const query = {};
    
    if (target_role) query.target_role = target_role;
    if (priority) query.priority = priority;
    if (is_active !== undefined) query.is_active = is_active === 'true';
    
    // Filter out expired announcements
    query.$or = [
      { expires_at: { $exists: false } },
      { expires_at: { $gt: new Date() } }
    ];
    
    const announcements = await Announcement.find(query)
      .populate('created_by', 'username')
      .sort({ created_at: -1 });
    
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/announcements/role/:role — Get announcements for specific role
router.get('/role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const query = {
      $or: [
        { target_role: role },
        { target_role: 'all' }
      ],
      is_active: true,
      $or: [
        { expires_at: { $exists: false } },
        { expires_at: { $gt: new Date() } }
      ]
    };
    
    const announcements = await Announcement.find(query)
      .populate('created_by', 'username')
      .sort({ priority: -1, created_at: -1 });
    
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/announcements/:id — Get announcement details
router.get('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('created_by', 'username');
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    res.json(announcement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/announcements/:id — Update announcement
router.put('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    res.json(announcement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/announcements/:id — Delete announcement (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { is_active: false },
      { new: true }
    );
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    res.json({ message: 'Announcement deactivated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/announcements/:id/activate — Activate announcement
router.post('/:id/activate', async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { is_active: true },
      { new: true }
    );
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    res.json(announcement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/announcements/urgent — Get urgent announcements
router.get('/urgent/all', async (req, res) => {
  try {
    const announcements = await Announcement.find({
      priority: 'urgent',
      is_active: true,
      $or: [
        { expires_at: { $exists: false } },
        { expires_at: { $gt: new Date() } }
      ]
    })
    .populate('created_by', 'username')
    .sort({ created_at: -1 });
    
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 