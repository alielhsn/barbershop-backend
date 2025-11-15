// barbershopfourr/server/controllers/businessAdController.js
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

exports.getBusinessAds = async (req, res) => {
  try {
    const [result] = await db.query(
      'SELECT * FROM business_ads WHERE is_active = true ORDER BY created_at DESC'
    );
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch business ads' });
  }
};

exports.createBusinessAd = async (req, res) => {
  try {
    // Handle FormData
    let title, title_ar, description, description_ar, redirect_url, images;
    
    if (req.body) {
      title = req.body.title;
      title_ar = req.body.title_ar;
      description = req.body.description;
      description_ar = req.body.description_ar;
      redirect_url = req.body.redirect_url;
      
      // Parse images if it's a stringified array
      if (req.body.images) {
        if (typeof req.body.images === 'string') {
          try {
            images = JSON.parse(req.body.images);
          } catch (e) {
            console.error('Error parsing images JSON:', e);
            images = [];
          }
        } else if (Array.isArray(req.body.images)) {
          images = req.body.images;
        }
      }
    }

    const [result] = await db.query(
      'INSERT INTO business_ads (title, title_ar, description, description_ar, redirect_url, images) VALUES (?, ?, ?, ?, ?, ?)',
      [title, title_ar, description, description_ar, redirect_url, JSON.stringify(images || [])]
    );
    
    // Get the inserted business ad
    const [newBusinessAd] = await db.query('SELECT * FROM business_ads WHERE id = ?', [result.insertId]);
    
    res.status(201).json(newBusinessAd[0]);
  } catch (err) {
    console.error('Error creating business ad:', err);
    res.status(500).json({ error: 'Failed to create business ad' });
  }
};

exports.updateBusinessAd = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Handle FormData
    let title, title_ar, description, description_ar, redirect_url, images;
    
    if (req.body) {
      title = req.body.title;
      title_ar = req.body.title_ar;
      description = req.body.description;
      description_ar = req.body.description_ar;
      redirect_url = req.body.redirect_url;
      
      // Parse images if it's a stringified array
      if (req.body.images) {
        if (typeof req.body.images === 'string') {
          try {
            images = JSON.parse(req.body.images);
          } catch (e) {
            console.error('Error parsing images JSON:', e);
            images = [];
          }
        } else if (Array.isArray(req.body.images)) {
          images = req.body.images;
        }
      }
    }

    await db.query(
      'UPDATE business_ads SET title = ?, title_ar = ?, description = ?, description_ar = ?, redirect_url = ?, images = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, title_ar, description, description_ar, redirect_url, JSON.stringify(images || []), id]
    );
    
    // Get the updated business ad
    const [updatedBusinessAd] = await db.query('SELECT * FROM business_ads WHERE id = ?', [id]);
    
    if (updatedBusinessAd.length === 0) {
      return res.status(404).json({ error: 'Business ad not found' });
    }
    
    res.json(updatedBusinessAd[0]);
  } catch (err) {
    console.error('Error updating business ad:', err);
    res.status(500).json({ error: 'Failed to update business ad' });
  }
};

exports.deleteBusinessAd = async (req, res) => {
  const { id } = req.params;

  try {
    // First, get the business ad to retrieve the image URLs
    const [adResult] = await db.query('SELECT images FROM business_ads WHERE id = ?', [id]);
    
    if (adResult.length === 0) {
      return res.status(404).json({ error: 'Business ad not found' });
    }
    
    const images = adResult[0].images || [];
    
    // Delete the business ad from the database
    const [result] = await db.query(
      'DELETE FROM business_ads WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Business ad not found' });
    }
    
    // Delete the image files if they exist
    if (images.length > 0) {
      try {
        for (const imageUrl of images) {
          // Extract filename from URL
          const filename = imageUrl.split('/').pop();
          const filePath = path.join(__dirname, '..', 'uploads', 'business_ads', filename);
          
          // Check if file exists before deleting
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      } catch (fileErr) {
        console.error('Failed to delete image files:', fileErr);
        // Continue even if file deletion fails
      }
    }

    res.json({ message: 'Business ad deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete business ad' });
  }
};

exports.toggleBusinessAdStatus = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query(
      'UPDATE business_ads SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    // Get the updated business ad
    const [updatedBusinessAd] = await db.query('SELECT * FROM business_ads WHERE id = ?', [id]);

    if (updatedBusinessAd.length === 0) {
      return res.status(404).json({ error: 'Business ad not found' });
    }

    res.json(updatedBusinessAd[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle business ad status' });
  }
};

// Add this new function to get all business ads for admin
exports.getAllBusinessAds = async (req, res) => {
  try {
    const [result] = await db.query(
      'SELECT * FROM business_ads ORDER BY created_at DESC'
    );
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch all business ads' });
  }
};

