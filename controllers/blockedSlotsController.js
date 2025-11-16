// barbershopfourr/server/controllers/blockedSlotsController.js
const db = require('../config/db');

// Create blocked slot
exports.createBlockedSlot = async (req, res) => {
  const { barber_name, date, times, is_all_day, reason } = req.body;

  try {
    if (!barber_name || !date) {
      return res.status(400).json({ error: 'Barber name and date are required' });
    }

    const timesText = JSON.stringify(times || []);

    const [result] = await db.query(
      'INSERT INTO blocked_slots (barber_name, date, times, is_all_day, reason) VALUES (?, ?, ?, ?, ?)',
      [barber_name, date, timesText, is_all_day || false, reason || null]
    );

    // Get the inserted blocked slot
    const [newBlockedSlotRows] = await db.query('SELECT * FROM blocked_slots WHERE id = ?', [result.insertId]);
    let newBlockedSlot = newBlockedSlotRows[0];

    // Parse times TEXT into array
    try {
      newBlockedSlot.times = newBlockedSlot.times ? JSON.parse(newBlockedSlot.times) : [];
    } catch (e) {
      newBlockedSlot.times = [];
    }

    res.status(201).json(newBlockedSlot);
  } catch (err) {
    console.error('Error creating blocked slot:', err);
    res.status(500).json({ error: 'Failed to create blocked slot: ' + err.message });
  }
};

// Get blocked slots
exports.getBlockedSlots = async (req, res) => {
  try {
    const { barber_name, date } = req.query;
    
    let query = 'SELECT * FROM blocked_slots WHERE 1=1';
    let queryParams = [];

    if (barber_name) {
      query += ' AND barber_name = ?';
      queryParams.push(barber_name);
    }

    if (date) {
      query += ' AND date = ?';
      queryParams.push(date);
    }

    query += ' ORDER BY date ASC, created_at ASC';

    const [result] = await db.query(query, queryParams);

    const parsed = result.map(slot => {
      let timesArr = [];
      try {
        timesArr = slot.times ? JSON.parse(slot.times) : [];
      } catch (e) {
        timesArr = [];
      }
      return {
        ...slot,
        times: timesArr
      };
    });

    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch blocked slots' });
  }
};

// Delete blocked slot
exports.deleteBlockedSlot = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      'DELETE FROM blocked_slots WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Blocked slot not found' });
    }

    res.json({ message: 'Blocked slot deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete blocked slot' });
  }
};

// Get all blocked slots
exports.getAllBlockedSlots = async (req, res) => {
  try {
    const [result] = await db.query(`
      SELECT * FROM blocked_slots 
      ORDER BY date ASC, created_at ASC
    `);

    const parsed = result.map(slot => {
      let timesArr = [];
      try {
        timesArr = slot.times ? JSON.parse(slot.times) : [];
      } catch (e) {
        timesArr = [];
      }
      return {
        ...slot,
        times: timesArr
      };
    });
    
    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch blocked slots' });
  }
};

// Clean up past blocked slots
exports.cleanupPastBlockedSlots = async () => {
  try {
    const moment = require('moment-timezone');
    
    // Get current date in Lebanon timezone
    const todayLebanon = moment().tz('Asia/Beirut').format('YYYY-MM-DD');
    
    // Delete blocked slots where date is before today in Lebanon time
    const [result] = await db.query(
      'DELETE FROM blocked_slots WHERE date < ?',
      [todayLebanon]
    );
    
    return result;
  } catch (err) {
    console.error('Error cleaning up past blocked slots:', err);
    throw err;
  }
};
