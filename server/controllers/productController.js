// barbershopfourr/server/controllers/productController.js
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

exports.getProducts = async (req, res) => {
  try {
    const [result] = await db.query(
      'SELECT id, name, name_ar, description, description_ar, price, image_url FROM products WHERE is_active = true'
    );
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    let image_url = '';
    
    // If file was uploaded, construct the URL with correct path
    if (req.file) {
      image_url = `${req.protocol}://${req.get('host')}/uploads/products/${req.file.filename}`;
    } else if (req.body.image_url) {
      image_url = req.body.image_url;
    }

    const { name, name_ar, description, description_ar, price } = req.body;

    const [result] = await db.query(
      'INSERT INTO products (name, name_ar, description, description_ar, price, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [name, name_ar, description, description_ar, price, image_url]
    );

    // Get the inserted product
    const [newProduct] = await db.query('SELECT * FROM products WHERE id = ?', [result.insertId]);

    res.status(201).json(newProduct[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;
   try {
    let image_url = req.body.image_url; // Get the image URL from the request body
    
    // If a new file was uploaded, use the new image URL with correct path
    if (req.file) {
      image_url = `${req.protocol}://${req.get('host')}/uploads/products/${req.file.filename}`;
    }

    const { name, name_ar, description, description_ar, price } = req.body;

    await db.query(
      'UPDATE products SET name = ?, name_ar = ?, description = ?, description_ar = ?, price = ?, image_url = ? WHERE id = ?',
      [name, name_ar, description, description_ar, price, image_url, id]
    );
    
    // Get the updated product
    const [updatedProduct] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    
    if (updatedProduct.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(updatedProduct[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    // First, get the product to retrieve the image URL
    const [productResult] = await db.query('SELECT image_url FROM products WHERE id = ?', [id]);
    
    if (productResult.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const imageUrl = productResult[0].image_url;
    
    // Delete the product from the database (hard delete)
    const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Delete the image file if it exists
    if (imageUrl) {
      try {
        // Extract filename from URL
        const filename = imageUrl.split('/').pop();
        const filePath = path.join(__dirname, '..', 'uploads', 'products', filename);
        
        // Check if file exists before deleting
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileErr) {
        console.error('Failed to delete image file:', fileErr);
        // Continue even if file deletion fails
      }
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

