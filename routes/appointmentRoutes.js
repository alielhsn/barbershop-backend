//barbershopfourr/server/routes/appointmentRoutes.js
const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken, isAdmin } = require('../middlewares/authMiddleware');
const router = express.Router();

// Public route - no authentication required
router.get('/', appointmentController.getAppointments);

// Routes requiring authentication
router.post('/', authenticateToken, appointmentController.createAppointment);
router.get('/client', authenticateToken, appointmentController.getClientAppointments);
router.delete('/:id', authenticateToken, appointmentController.deleteAppointment);
router.put('/:id', authenticateToken, appointmentController.updateAppointment);

// Admin-only routes
router.get('/all', isAdmin, appointmentController.getAllAppointments);
router.get('/debug/appointments', isAdmin, appointmentController.debugAppointments);
router.get('/analyzed', isAdmin, appointmentController.getAnalyzedAppointments);

// Manual cleanup route
router.post('/cleanup', isAdmin, async (req, res) => {
  try {
    const deletedAppointments = await appointmentController.cleanupPastAppointments();
    res.json({
      success: true,
      deletedCount: deletedAppointments.length,
      message: `Deleted ${deletedAppointments.length} past appointments`
    });
  } catch (error) {
    console.error('Manual cleanup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete past appointments'
    });
  }
});

// Helper functions for time conversion
function convertTimeToMinutes(timeStr) {
  // Handle both "HH:MM AM/PM" and "HH:MM:SS" formats
  let time = timeStr;

  // If it's in 24-hour format with seconds, remove seconds
  if (time.includes(':')) {
    const parts = time.split(':');
    time = `${parts[0]}:${parts[1]}`;

    // If it's 24-hour format, convert to 12-hour for parsing
    if (parts.length === 3 && !timeStr.includes('AM') && !timeStr.includes('PM')) {
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      time = `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    }
  }

  // Parse the time string
  const [timePart, period] = time.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);

  // Convert to 24-hour format for calculation
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

function convertMinutesTo24h(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

module.exports = router;

