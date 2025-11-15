// barbershopfourr/server/controllers/serviceController.js
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

exports.getServices = async (req, res) => {
  try {
    const [result] = await db.query(
      'SELECT id, name, name_ar, description, description_ar, price, image_url FROM services WHERE is_active = true'
    );
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

exports.createService = async (req, res) => {
  try {
    let image_url = '';
    
    // If file was uploaded, construct the URL with correct path
    if (req.file) {
      image_url = `${req.protocol}://${req.get('host')}/uploads/services/${req.file.filename}`;
    } else if (req.body.image_url) {
      image_url = req.body.image_url;
    }
    
    const { name, name_ar, description, description_ar, price } = req.body;

    const [result] = await db.query(
      'INSERT INTO services (name, name_ar, description, description_ar, price, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [name, name_ar, description, description_ar, price, image_url]
    );

    // Get the inserted service
    const [newService] = await db.query('SELECT * FROM services WHERE id = ?', [result.insertId]);
    
    res.status(201).json(newService[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create service' });
  }
};

exports.updateService = async (req, res) => {
  const { id } = req.params;
  
  try {
    let image_url = req.body.image_url; // Get the image URL from the request body
    
    // If a new file was uploaded, use the new image URL with correct path
    if (req.file) {
      image_url = `${req.protocol}://${req.get('host')}/uploads/services/${req.file.filename}`;
    }
    
    const { name, name_ar, description, description_ar, price } = req.body;

    await db.query(
      'UPDATE services SET name = ?, name_ar = ?, description = ?, description_ar = ?, price = ?, image_url = ? WHERE id = ?',
      [name, name_ar, description, description_ar, price, image_url, id]
    );
    
    // Get the updated service
    const [updatedService] = await db.query('SELECT * FROM services WHERE id = ?', [id]);
    
    if (updatedService.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json(updatedService[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update service' });
  }
};

exports.deleteService = async (req, res) => {
  const { id } = req.params;

  try {
    // First, get the service to retrieve the image URL
    const [serviceResult] = await db.query('SELECT image_url FROM services WHERE id = ?', [id]);
    
    if (serviceResult.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    const imageUrl = serviceResult[0].image_url;
    
    // Delete the service from the database (hard delete)
    const [result] = await db.query('DELETE FROM services WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Delete the image file if it exists
    if (imageUrl) {
      try {
        // Extract filename from URL
        const filename = imageUrl.split('/').pop();
        const filePath = path.join(__dirname, '..', 'uploads', 'services', filename);
        
        // Check if file exists before deleting
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileErr) {
        console.error('Failed to delete image file:', fileErr);
        // Continue even if file deletion fails
      }
    }
    
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete service' });
  }
};

