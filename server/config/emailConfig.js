// barbershopfourr/src/config/emailConfig.js
const nodemailer = require('nodemailer');

// Remove the dotenv.config line - it's already loaded in server.js

// Create transporters for each barber
const createTransporter = (user, pass) => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass
    }
  });
};

// Email template function - UPDATED TO ARABIC
const createReservationEmail = (reservationData, isBarber = false) => {
  if (isBarber) {
    return `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6;">
        <h2 style="color: #2D2D2D; border-bottom: 2px solid #E0AE33; padding-bottom: 10px;">حجز موعد جديد</h2>
        <p><strong style="color: #E0AE33;">اسم الزبون:</strong> ${reservationData.client_name}</p>
        <p><strong style="color: #E0AE33;">رقم الهاتف:</strong> ${reservationData.phone_number}</p>
        <p><strong style="color: #E0AE33;">التاريخ:</strong> ${reservationData.appointment_date}</p>
        <p><strong style="color: #E0AE33;">الوقت:</strong> ${reservationData.appointment_time}</p>
        <p><strong style="color: #E0AE33;">الخدمات:</strong> ${Array.isArray(reservationData.services) ? reservationData.services.join('، ') : reservationData.services}</p>
        <br/>
        <p style="color: #666; font-style: italic; border-top: 1px solid #eee; padding-top: 10px;">
          هذه رسالة آلية من نظام حجز الصالون الخاص بك.
        </p>
      </div>
    `;
  } else {
    return `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6;">
        <h2 style="color: #2D2D2D; border-bottom: 2px solid #E0AE33; padding-bottom: 10px;">تم استلام حجز جديد</h2>
        <p><strong style="color: #E0AE33;">اسم الزبون:</strong> ${reservationData.client_name}</p>
        <p><strong style="color: #E0AE33;">رقم الهاتف:</strong> ${reservationData.phone_number}</p>
        <p><strong style="color: #E0AE33;">الحلاق:</strong> ${reservationData.barber_name}</p>
        <p><strong style="color: #E0AE33;">التاريخ:</strong> ${reservationData.appointment_date}</p>
        <p><strong style="color: #E0AE33;">الوقت:</strong> ${reservationData.appointment_time}</p>
        <p><strong style="color: #E0AE33;">الخدمات:</strong> ${Array.isArray(reservationData.services) ? reservationData.services.join('، ') : reservationData.services}</p>
        <br/>
        <p style="color: #666; font-style: italic; border-top: 1px solid #eee; padding-top: 10px;">
          هذه رسالة آلية من نظام حجز الصالون الخاص بك.
        </p>
      </div>
    `;
  }
};

// Email sending function with error handling
const sendReservationEmail = async (reservationData) => {
  try {
    // Determine which barber's email to use
    let barberEmail, barberPassword;
    
    // Check if barber name is "mohamad" (case-insensitive)
    if (reservationData.barber_name.toLowerCase().includes('mohamad')) {
      barberEmail = process.env.MOHAMAD_EMAIL;
      barberPassword = process.env.MOHAMAD_EMAIL_PASSWORD;
      //console.log('Sending email to Mohamad');
    } else {
      // For ALL other barbers (including Jamil), send to Jamil
      barberEmail = process.env.JAMIL_EMAIL;
      barberPassword = process.env.JAMIL_EMAIL_PASSWORD;
      //console.log('Sending email to Jamil');
    }

    // Send to barber only (removed admin email)
    if (barberEmail && barberPassword) {
      const barberTransporter = createTransporter(barberEmail, barberPassword);
      const barberMailOptions = {
        from: barberEmail,
        to: barberEmail,
        subject: 'حجز موعد جديد', // Arabic subject
        html: createReservationEmail(reservationData, true)
      };

      await barberTransporter.sendMail(barberMailOptions);
      //console.log(`Reservation email sent to barber (${reservationData.barber_name}) successfully`);
    }

    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

// Add this function to create edit notification email - UPDATED TO ARABIC
const createEditNotificationEmail = (oldAppointment, newAppointmentData) => {
  return `
    <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6;">
      <h2 style="color: #2D2D2D; border-bottom: 2px solid #E0AE33; padding-bottom: 10px;">تم تعديل الموعد من قبل الزبون</h2>
      <p><strong style="color: #E0AE33;">اسم الزبون:</strong> ${oldAppointment.client_name}</p>
      <p><strong style="color: #E0AE33;">رقم الهاتف:</strong> ${oldAppointment.phone_number}</p>
      
      <h3 style="color: #2D2D2D; margin-top: 20px;">الموعد الأصلي:</h3>
      <ul style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
        <li><strong style="color: #E0AE33;">الحلاق:</strong> ${oldAppointment.barber_name}</li>
        <li><strong style="color: #E0AE33;">التاريخ:</strong> ${oldAppointment.appointment_date}</li>
        <li><strong style="color: #E0AE33;">الوقت:</strong> ${oldAppointment.appointment_time}</li>
        <li><strong style="color: #E0AE33;">الخدمات:</strong> ${Array.isArray(oldAppointment.services) ? oldAppointment.services.join('، ') : oldAppointment.services}</li>
      </ul>
      
      <h3 style="color: #2D2D2D; margin-top: 20px;">تفاصيل الموعد الجديد:</h3>
      <ul style="background: #f0f8f0; padding: 15px; border-radius: 5px;">
        <li><strong style="color: #E0AE33;">الحلاق:</strong> ${newAppointmentData.barber_name}</li>
        <li><strong style="color: #E0AE33;">التاريخ:</strong> ${newAppointmentData.appointment_date}</li>
        <li><strong style="color: #E0AE33;">الوقت:</strong> ${newAppointmentData.appointment_time}</li>
        <li><strong style="color: #E0AE33;">الخدمات:</strong> ${Array.isArray(newAppointmentData.services) ? newAppointmentData.services.join('، ') : newAppointmentData.services}</li>
      </ul>
      
      <br/>
      <p style="color: #666; font-style: italic; border-top: 1px solid #eee; padding-top: 10px;">
        هذه رسالة آلية من نظام حجز الصالون الخاص بك.
      </p>
    </div>
  `;
};

// Add this function to send edit notification
const sendEditNotificationEmail = async (oldAppointment, newAppointmentData) => {
  try {
    // Determine which barber's email to use
    let barberEmail, barberPassword;
    
    // Check if barber name is "mohamad" (case-insensitive)
    if (newAppointmentData.barber_name.toLowerCase().includes('mohamad')) {
      barberEmail = process.env.MOHAMAD_EMAIL;
      barberPassword = process.env.MOHAMAD_EMAIL_PASSWORD;
      //console.log('Sending edit notification email to Mohamad');
    } else {
      // For ALL other barbers (including Jamil), send to Jamil
      barberEmail = process.env.JAMIL_EMAIL;
      barberPassword = process.env.JAMIL_EMAIL_PASSWORD;
      //console.log('Sending edit notification email to Jamil');
    }

    // Send to barber only (removed admin email)
    if (barberEmail && barberPassword) {
      const barberTransporter = createTransporter(barberEmail, barberPassword);
      const barberMailOptions = {
        from: barberEmail,
        to: barberEmail,
        subject: 'تم تعديل الموعد من قبل الزبون', // Arabic subject
        html: createEditNotificationEmail(oldAppointment, newAppointmentData)
      };

      await barberTransporter.sendMail(barberMailOptions);
      //console.log(`Edit notification email sent to barber (${newAppointmentData.barber_name}) successfully`);
    }

    return true;
  } catch (error) {
    console.error('Edit notification email sending failed:', error);
    return false;
  }
};

// Add this function to create deletion notification email - UPDATED TO ARABIC
const createDeletionNotificationEmail = (appointmentData, deletedBy) => {
  const deletedByText = deletedBy === 'Admin' ? 'المسؤول' : 'الزبون';
  
  // Format the date to match the appointment creation email format (DD-MM-YYYY)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Format current date for deletion timestamp
  const currentDate = new Date();
  const deletionDate = formatDate(currentDate);
  
  return `
    <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6;">
      <h2 style="color: #2D2D2D; border-bottom: 2px solid #E0AE33; padding-bottom: 10px;">تم حذف الموعد</h2>
      <p><strong style="color: #E0AE33;">تم الحذف بواسطة:</strong> ${deletedByText}</p>
      <p><strong style="color: #E0AE33;">اسم الزبون:</strong> ${appointmentData.client_name}</p>
      <p><strong style="color: #E0AE33;">رقم الهاتف:</strong> ${appointmentData.phone_number}</p>
      <p><strong style="color: #E0AE33;">الحلاق:</strong> ${appointmentData.barber_name}</p>
      <p><strong style="color: #E0AE33;">تاريخ الموعد الأصلي:</strong> ${formatDate(appointmentData.appointment_date)}</p>
      <p><strong style="color: #E0AE33;">وقت الموعد الأصلي:</strong> ${appointmentData.appointment_time}</p>
      <p><strong style="color: #E0AE33;">الخدمات:</strong> ${Array.isArray(appointmentData.services) ? appointmentData.services.join('، ') : appointmentData.services}</p>
      <p><strong style="color: #E0AE33;">تاريخ الحذف:</strong> ${deletionDate}</p>
      <br/>
      <p style="color: #666; font-style: italic; border-top: 1px solid #eee; padding-top: 10px;">
        هذه رسالة آلية من نظام حجز الصالون الخاص بك.
      </p>
    </div>
  `;
};

// Add this function to send deletion notification
const sendDeletionNotificationEmail = async (appointmentData, deletedBy = 'Client') => {
  try {
    // Determine which barber's email to use
    let barberEmail, barberPassword;
    
    // Check if barber name is "mohamad" (case-insensitive)
    if (appointmentData.barber_name.toLowerCase().includes('mohamad')) {
      barberEmail = process.env.MOHAMAD_EMAIL;
      barberPassword = process.env.MOHAMAD_EMAIL_PASSWORD;
      //console.log('Sending deletion notification email to Mohamad');
    } else {
      // For ALL other barbers (including Jamil), send to Jamil
      barberEmail = process.env.JAMIL_EMAIL;
      barberPassword = process.env.JAMIL_EMAIL_PASSWORD;
      //console.log('Sending deletion notification email to Jamil');
    }

    // Send to barber only
    if (barberEmail && barberPassword) {
      const barberTransporter = createTransporter(barberEmail, barberPassword);
      const barberMailOptions = {
        from: barberEmail,
        to: barberEmail,
        subject: 'تم حذف الموعد', // Arabic subject
        html: createDeletionNotificationEmail(appointmentData, deletedBy)
      };

      await barberTransporter.sendMail(barberMailOptions);
      //console.log(`Deletion notification email sent to barber (${appointmentData.barber_name}) successfully`);
    }

    return true;
  } catch (error) {
    console.error('Deletion notification email sending failed:', error);
    return false;
  }
};

module.exports = { 
  createTransporter, 
  createReservationEmail, 
  sendReservationEmail,
  createEditNotificationEmail,
  sendEditNotificationEmail,
  createDeletionNotificationEmail,  
  sendDeletionNotificationEmail    
};