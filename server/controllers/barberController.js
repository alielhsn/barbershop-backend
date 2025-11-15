// barbershopfourr/server/controllers/barberController.js
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

exports.getBarbers = async (req, res) => {
  try {
    const [result] = await db.query('SELECT * FROM barbers WHERE is_active = true ORDER BY name');
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch barbers' });
  }
};

exports.createBarber = async (req, res) => {
  try {
    let image_url = '';
    
    // If file was uploaded, construct the URL
    if (req.file) {
      image_url = `${req.protocol}://${req.get('host')}/uploads/barbers/${req.file.filename}`;
    } else if (req.body.image_url) {
      image_url = req.body.image_url;
    }

    const { name, name_ar, experience, experience_ar, description, description_ar, specialty, specialty_ar } = req.body;

    const [result] = await db.query(
      'INSERT INTO barbers (name, name_ar, experience, experience_ar, description, description_ar, specialty, specialty_ar, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, name_ar, experience, experience_ar, description, description_ar, specialty, specialty_ar, image_url]
    );

    // Get the inserted barber
    const [newBarber] = await db.query('SELECT * FROM barbers WHERE id = ?', [result.insertId]);

    res.status(201).json(newBarber[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create barber' });
  }
};

exports.updateBarber = async (req, res) => {
  const { id } = req.params;
  try {
    // First, get the current barber to have the existing image
    const [barberResult] = await db.query('SELECT image_url FROM barbers WHERE id = ?', [id]);
    if (barberResult.length === 0) {
      return res.status(404).json({ error: 'Barber not found' });
    }
    
    let image_url = barberResult[0].image_url; // Default to existing image
    
    // If a new file was uploaded, use it instead
    if (req.file) {
      image_url = `${req.protocol}://${req.get('host')}/uploads/barbers/${req.file.filename}`;
    } else if (req.body.image_url) {
      // If an image_url is provided in the body, use that
      image_url = req.body.image_url;
    }

    const { name, name_ar, experience, experience_ar, description, description_ar, specialty, specialty_ar, is_active } = req.body;

    await db.query(
      'UPDATE barbers SET name = ?, name_ar = ?, experience = ?, experience_ar = ?, description = ?, description_ar = ?, specialty = ?, specialty_ar = ?, image_url = ?, is_active = ? WHERE id = ?',
      [name, name_ar, experience, experience_ar, description, description_ar, specialty, specialty_ar, image_url, is_active, id]
    );

    // Get the updated barber
    const [updatedBarber] = await db.query('SELECT * FROM barbers WHERE id = ?', [id]);

    if (updatedBarber.length === 0) {
      return res.status(404).json({ error: 'Barber not found' });
    }

    res.json(updatedBarber[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update barber' });
  }
};

exports.deleteBarber = async (req, res) => {
  const { id } = req.params;

  try {
    // First, get the barber to retrieve the image URL
    const [barberResult] = await db.query('SELECT image_url FROM barbers WHERE id = ?', [id]);
    
    if (barberResult.length === 0) {
      return res.status(404).json({ error: 'Barber not found' });
    }
    
    const imageUrl = barberResult[0].image_url;
    
    // Delete the barber from the database
    const [result] = await db.query(
      'DELETE FROM barbers WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Barber not found' });
    }
    
    // Delete the image file if it exists
    if (imageUrl) {
      try {
        // Extract filename from URL
        const filename = imageUrl.split('/').pop();
        const filePath = path.join(__dirname, '..', 'uploads', 'barbers', filename);
        
        // Check if file exists before deleting
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileErr) {
        console.error('Failed to delete image file:', fileErr);
        // Continue even if file deletion fails
      }
    }

    res.json({ message: 'Barber deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete barber' });
  }
};

