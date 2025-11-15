//barbershopfourr/server/routes/upload.js
const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');

// Upload endpoint for different types
router.post('/:type', upload.single('image'), (req, res) => {
try {
if (!req.file) {
return res.status(400).json({ error: 'No file uploaded' });
}

// Construct the correct URL path based on type
const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.params.type}s/${req.file.filename}`;

//console.log('File uploaded successfully:', imageUrl); // Debug log

res.json({
message: 'File uploaded successfully',
imageUrl: imageUrl
});
} catch (error) {
console.error('Upload error:', error);
res.status(500).json({ error: 'Failed to upload file' });
}
});

module.exports = router;

