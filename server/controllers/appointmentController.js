 //barbershopfourr/server/controllers/appointmentController.js
const db = require('../config/db');
const cron = require('node-cron');
const { sendReservationEmail, sendEditNotificationEmail, sendDeletionNotificationEmail } = require('../config/emailConfig');
const moment = require('moment-timezone');

// Add this helper function to insert into appointments_analyze
const insertIntoAppointmentsAnalyze = async (appointmentData) => {
  try {
    await db.query(
      'INSERT INTO appointments_analyze (client_name, barber_name, appointment_date, appointment_time) VALUES (?, ?, ?, ?)',
      [appointmentData.client_name, appointmentData.barber_name, appointmentData.appointment_date, appointmentData.appointment_time]
    );
  } catch (err) {
    console.error('Error inserting into appointments_analyze:', err);
  }
};

exports.createAppointment = async (req, res) => {
  const { client_name, phone_number, barber_name, date, time, services } = req.body;

  try {
    // Validate that barber_name is in English format
    const [barberCheck] = await db.query(
      'SELECT name FROM barbers WHERE name = ? OR name_ar = ?',
      [barber_name, barber_name]
    );

    if (barberCheck.length === 0) {
      return res.status(400).json({ error: 'Invalid barber selected' });
    }

    const englishBarberName = barberCheck[0].name;

    // First check if the time slot is blocked
    const [blockedSlotCheck] = await db.query(
      `SELECT * FROM blocked_slots 
       WHERE barber_name = ? 
       AND date = ?
       AND (
         (is_all_day = true) OR
         (JSON_CONTAINS(times, JSON_QUOTE(?)))
       )`,
      [englishBarberName, date, time]
    );

    if (blockedSlotCheck.length > 0) {
      return res.status(400).json({ error: 'This time slot is not available' });
    }

    // Then check if the time slot is already booked
    const [existingAppointment] = await db.query(
      'SELECT * FROM appointments WHERE barber_name = ? AND appointment_date = ? AND appointment_time = ?',
      [englishBarberName, date, time]
    );

    if (existingAppointment.length > 0) {
      return res.status(400).json({ error: 'This time slot is already booked' });
    }

    const [result] = await db.query(
      'INSERT INTO appointments (client_name, phone_number, barber_name, appointment_date, appointment_time, services) VALUES (?, ?, ?, ?, ?, ?)',
      [client_name, phone_number, englishBarberName, date, time, JSON.stringify(services)]
    );

    // Get the inserted appointment
    const [newAppointment] = await db.query(
      'SELECT * FROM appointments WHERE id = ?',
      [result.insertId]
    );

    // === ADD TO ANALYZE TABLE ===
    try {
      await db.query(
        'INSERT INTO appointments_analyze (client_name, barber_name, appointment_date, appointment_time) VALUES (?, ?, ?, ?)',
        [client_name, englishBarberName, date, time]
      );
    } catch (analyzeErr) {
      console.error('Error inserting into appointments_analyze:', analyzeErr);
    }

    // === ADD EMAIL NOTIFICATION HERE ===
    const emailSent = await sendReservationEmail({
      client_name: client_name,
      phone_number: phone_number,
      barber_name: englishBarberName,
      appointment_date: date,
      appointment_time: time,
      services: services
    });

    if (!emailSent) {
      console.warn('Failed to send notification emails');
    }

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment: newAppointment[0]
    });

  } catch (err) {
    console.error('Error creating appointment:', err);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const { barber_name, date } = req.query;
    
    if (!barber_name || !date) {
      return res.status(400).json({ error: 'Both barber_name and date are required' });
    }
    
    // Convert Arabic barber name to English if needed
    let englishBarberName = barber_name;
    const [barberCheck] = await db.query(
      'SELECT name FROM barbers WHERE name = ? OR name_ar = ?',
      [barber_name, barber_name]
    );
    
    if (barberCheck.length > 0) {
      englishBarberName = barberCheck[0].name;
    }
    
    // Get regular appointments using English name
    const [appointmentsResult] = await db.query(
      'SELECT * FROM appointments WHERE barber_name = ? AND appointment_date = ? ORDER BY appointment_time ASC',
      [englishBarberName, date]
    );
    
    // Get blocked slots for this date using English name
    const [blockedSlotsResult] = await db.query(
      `SELECT * FROM blocked_slots 
      WHERE barber_name = ? 
      AND date = ?`,
      [englishBarberName, date]
    );
    
    // Combine appointments and blocked slots
    const allBookings = [
      ...appointmentsResult,
      ...blockedSlotsResult
    ];
    
    res.setHeader('Content-Type', 'application/json');
    res.json(allBookings);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

// New endpoint to get all appointments for admin dashboard
exports.getAllAppointments = async (req, res) => {
  try {
    const [result] = await db.query(
      'SELECT * FROM appointments ORDER BY appointment_date ASC, appointment_time ASC'
    );
    
    res.setHeader('Content-Type', 'application/json');
    res.json(result);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.deleteAppointment = async (req, res) => {
  const { id } = req.params;

  try {
    // First, get the appointment data before deleting it
    const [appointmentResult] = await db.query(
      'SELECT * FROM appointments WHERE id = ?',
      [id]
    );

    if (appointmentResult.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointment = appointmentResult[0];

    // Delete the appointment
    const [result] = await db.query(
      'DELETE FROM appointments WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // === ADD DELETION NOTIFICATION EMAIL HERE ===
    const deletedBy = req.user && req.user.isAdmin ? 'Admin' : 'Client';
    
    const emailSent = await sendDeletionNotificationEmail(appointment, deletedBy);
    
    if (!emailSent) {
      console.warn('Failed to send deletion notification email');
    }

    res.json({ message: 'Appointment deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
};

exports.updateAppointment = async (req, res) => {
  const { id } = req.params;
  const { client_name, phone_number, barber_name, appointment_date, appointment_time, services } = req.body;

  try {
    // First, get the old appointment data
    const [oldAppointmentResult] = await db.query(
      'SELECT * FROM appointments WHERE id = ?',
      [id]
    );
    
    if (oldAppointmentResult.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    const oldAppointment = oldAppointmentResult[0];

    // First check if the new time slot is blocked
    const [blockedSlotCheck] = await db.query(
      `SELECT * FROM blocked_slots 
       WHERE barber_name = ? 
       AND date = ?
       AND (
         (is_all_day = true) OR
         (JSON_CONTAINS(times, JSON_QUOTE(?)))
       )`,
      [barber_name, appointment_date, appointment_time]
    );

    if (blockedSlotCheck.length > 0) {
      return res.status(400).json({ error: 'This time slot is not available' });
    }

    // Then check if the new time slot is already booked by another appointment
    const [existingAppointment] = await db.query(
      'SELECT * FROM appointments WHERE barber_name = ? AND appointment_date = ? AND appointment_time = ? AND id != ?',
      [barber_name, appointment_date, appointment_time, id]
    );

    if (existingAppointment.length > 0) {
      return res.status(400).json({ error: 'This time slot is already booked' });
    }

    await db.query(
      'UPDATE appointments SET client_name = ?, phone_number = ?, barber_name = ?, appointment_date = ?, appointment_time = ?, services = ? WHERE id = ?',
      [client_name, phone_number, barber_name, appointment_date, appointment_time, JSON.stringify(services), id]
    );

    // Get the updated appointment
    const [updatedAppointment] = await db.query(
      'SELECT * FROM appointments WHERE id = ?',
      [id]
    );

    if (updatedAppointment.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // === UPDATE ANALYZE TABLE ===
    try {
      // First try to update existing record in analyze table
      const [updateResult] = await db.query(
        'UPDATE appointments_analyze SET client_name = ?, barber_name = ?, appointment_date = ?, appointment_time = ? WHERE client_name = ? AND barber_name = ? AND appointment_date = ? AND appointment_time = ?',
        [
          client_name,
          barber_name,
          appointment_date,
          appointment_time,
          oldAppointment.client_name,
          oldAppointment.barber_name,
          oldAppointment.appointment_date,
          oldAppointment.appointment_time
        ]
      );

      // If no rows were updated (record doesn't exist in analyze table), insert a new one
      if (updateResult.affectedRows === 0) {
        await db.query(
          'INSERT INTO appointments_analyze (client_name, barber_name, appointment_date, appointment_time) VALUES (?, ?, ?, ?)',
          [client_name, barber_name, appointment_date, appointment_time]
        );
      }
    } catch (analyzeErr) {
      console.error('Error updating appointments_analyze:', analyzeErr);
    }

    // === ADD EDIT NOTIFICATION EMAIL HERE ===
    const newAppointmentData = {
      client_name: client_name,
      phone_number: phone_number,
      barber_name: barber_name,
      appointment_date: appointment_date,
      appointment_time: appointment_time,
      services: services
    };
    
    const emailSent = await sendEditNotificationEmail(oldAppointment, newAppointmentData);
    
    if (!emailSent) {
      console.warn('Failed to send edit notification emails');
    }

    res.json(updatedAppointment[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};

// Add new endpoint to get analyzed appointments
exports.getAnalyzedAppointments = async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    const [result] = await db.query(
      'SELECT * FROM appointments_analyze WHERE appointment_date = ? ORDER BY barber_name, appointment_time',
      [date]
    );
    
    res.json(result);
  } catch (err) {
    console.error('Error fetching analyzed appointments:', err);
    res.status(500).json({ error: 'Failed to fetch analyzed appointments' });
  }
};

// Add this helper function
const getLebanonDate = () => {
  const now = new Date();
  const lebanonTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
  return lebanonTime.toISOString().split('T')[0];
};

// Update your cleanup function
exports.cleanupPastAppointments = async () => {
  try {
    const nowLebanon = moment().tz('Asia/Beirut');
    const currentDate = nowLebanon.format('YYYY-MM-DD');
    const currentTime = nowLebanon.format('HH:mm:ss');
    
    // First get ALL appointments to see what we're working with
    const [allAppointments] = await db.query(
      `SELECT * FROM appointments ORDER BY appointment_date, appointment_time`
    );
    
    let deletedCount = 0;
    const deletedAppointments = [];
    
    const currentTimeMinutes = convertTimeToMinutes24h(currentTime);
    
    for (const appointment of allAppointments) {
      let shouldDelete = false;
      
      const appointmentDateOnly = moment(appointment.appointment_date).format('YYYY-MM-DD');
      
      if (appointmentDateOnly < currentDate) {
        shouldDelete = true;
      } else if (appointmentDateOnly === currentDate) {
        const appointmentTime24h = convertTo24hFormat(appointment.appointment_time);
        const appointmentTimeMinutes = convertTimeToMinutes24h(appointmentTime24h);
        
        if (appointmentTimeMinutes <= currentTimeMinutes) {
          shouldDelete = true;
        }
      }
      
      if (shouldDelete) {
        // Delete the appointment
        await db.query(
          'DELETE FROM appointments WHERE id = ?',
          [appointment.id]
        );
        deletedCount++;
        deletedAppointments.push(appointment);
      }
    }
    
    return deletedAppointments;
  } catch (err) {
    console.error('Error cleaning up past appointments:', err);
    throw err;
  }
};

// Add this helper function to convert 12h time to 24h format
function convertTo24hFormat(time12h) {
  if (!time12h) return '00:00';
  
  if (time12h.includes(':') && !time12h.includes('AM') && !time12h.includes('PM') && !time12h.includes('am') && !time12h.includes('pm')) {
    const parts = time12h.split(':');
    return `${parts[0].padStart(2, '0')}:${parts[1] || '00'}`;
  }
  
  let time = time12h.trim();
  let modifier = 'AM';
  
  if (time.includes('PM') || time.includes('pm')) {
    modifier = 'PM';
    time = time.replace(/(PM|pm)/i, '').trim();
  } else if (time.includes('AM') || time.includes('am')) {
    time = time.replace(/(AM|am)/i, '').trim();
  }
  
  const [hoursStr, minutesStr] = time.split(':');
  let hours = parseInt(hoursStr) || 0;
  const minutes = minutesStr ? parseInt(minutesStr) : 0;
  
  if (modifier === 'PM' && hours !== 12) {
    hours += 12;
  } else if (modifier === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Update this helper function for 24h time conversion
function convertTimeToMinutes24h(timeStr) {
  if (!timeStr) return 0;
  
  const timeParts = timeStr.split(':');
  const hours = parseInt(timeParts[0]) || 0;
  const minutes = parseInt(timeParts[1]) || 0;
  
  return hours * 60 + minutes;
}

// Add this function to appointmentController.js
exports.getClientAppointments = async (req, res) => {
  try {
    const { phone_number } = req.query;
    
    if (!phone_number) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    const [result] = await db.query(
      'SELECT * FROM appointments WHERE phone_number = ? ORDER BY appointment_date DESC, appointment_time DESC',
      [phone_number]
    );
    
    res.setHeader('Content-Type', 'application/json');
    res.json(result);
  } catch (err) {
    console.error('Database error in getClientAppointments:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

// Update your debug function to show raw database dates
exports.debugAppointments = async (req, res) => {
  try {
    const [result] = await db.query(`
      SELECT id, client_name, appointment_date, appointment_time 
      FROM appointments 
      ORDER BY appointment_date, appointment_time
    `);
    
    const nowLebanon = moment().tz('Asia/Beirut');
    const currentDate = nowLebanon.format('YYYY-MM-DD');
    const currentTime = nowLebanon.format('HH:mm:ss');
    const currentTimeMinutes = convertTimeToMinutes24h(currentTime);
    
    const appointmentsWithConversion = result.map(appt => {
      const appointmentTime24h = convertTo24hFormat(appt.appointment_time);
      const appointmentTimeMinutes = convertTimeToMinutes24h(appointmentTime24h);
      const appointmentDateOnly = moment(appt.appointment_date).format('YYYY-MM-DD');
      
      return {
        ...appt,
        raw_appointment_date: appt.appointment_date,
        formatted_date: appointmentDateOnly,
        converted_time_24h: appointmentTime24h,
        converted_minutes: appointmentTimeMinutes,
        should_delete: appointmentDateOnly < currentDate || 
                      (appointmentDateOnly === currentDate && appointmentTimeMinutes <= currentTimeMinutes)
      };
    });
    
    res.json({
      current_time: {
        date: currentDate,
        time: currentTime,
        minutes: currentTimeMinutes
      },
      appointments: appointmentsWithConversion
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Debug failed: ' + error.message });
  }
};

