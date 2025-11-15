//barbershopfourr/server/controllers/adController.js
const db = require('../config/db');

// Change this function to fetch ALL ads, not just active ones
exports.getAds = async (req, res) => {
  try {
    const [result] = await db.query(
      'SELECT * FROM ads ORDER BY created_at DESC' // Removed WHERE is_active = true
    );
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch ads' });
  }
};

exports.createAd = async (req, res) => {
  try {
    let image_url = '';
    
    if (req.file) {
      image_url = `${req.protocol}://${req.get('host')}/uploads/ads/${req.file.filename}`;
    } else if (req.body.image_url) {
      image_url = req.body.image_url;
    }
    
    const { title, title_ar, description, description_ar, price, deadline } = req.body;

    const [result] = await db.query(
      'INSERT INTO ads (title, title_ar, description, description_ar, price, deadline, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, title_ar, description, description_ar, price, deadline, image_url]
    );
    
    // Get the inserted ad
    const [newAd] = await db.query('SELECT * FROM ads WHERE id = ?', [result.insertId]);
    
    res.status(201).json(newAd[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create ad' });
  }
};

exports.updateAd = async (req, res) => {
  const { id } = req.params;
  
  try {
    let image_url = req.body.image_url;
    
    if (req.file) {
      image_url = `${req.protocol}://${req.get('host')}/uploads/ads/${req.file.filename}`;
    }
    
    const { title, title_ar, description, description_ar, price, deadline } = req.body;

    await db.query(
      'UPDATE ads SET title = ?, title_ar = ?, description = ?, description_ar = ?, price = ?, deadline = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, title_ar, description, description_ar, price, deadline, image_url, id]
    );
    
    // Get the updated ad
    const [updatedAd] = await db.query('SELECT * FROM ads WHERE id = ?', [id]);
    
    if (updatedAd.length === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }
    
    res.json(updatedAd[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update ad' });
  }
};

exports.deleteAd = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      'DELETE FROM ads WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    res.json({ message: 'Ad deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete ad' });
  }
};

exports.toggleAdStatus = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query(
      'UPDATE ads SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    // Get the updated ad
    const [updatedAd] = await db.query('SELECT * FROM ads WHERE id = ?', [id]);

    if (updatedAd.length === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    res.json(updatedAd[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle ad status' });
  }
};