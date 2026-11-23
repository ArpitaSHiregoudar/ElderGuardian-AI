const { Router } = require('express');
const { db } = require('../../config/database');
const { authenticate, authorize } = require('../../middleware/auth');
const { asyncHandler, AppError } = require('../../middleware/errorHandler');
const { success } = require('../../utils/response');

const router = Router();

// GET /api/v1/family/patients - List all patients managed by this caregiver
router.get(
  '/patients',
  authenticate,
  authorize('FAMILY_MEMBER'),
  asyncHandler(async (req, res) => {
    const links = await db('family_links')
      .join('patients', 'family_links.patient_id', 'patients.id')
      .join('users', 'patients.user_id', 'users.id')
      .where('family_links.family_member_id', req.user.id)
      .where('family_links.consent_status', 'APPROVED')
      .select(
        'family_links.relationship',
        'family_links.is_primary_caregiver',
        'family_links.can_view_health',
        'family_links.can_manage_appointments',
        'family_links.can_approve_refills',
        'patients.id as patient_id',
        'patients.blood_group',
        'patients.medical_conditions',
        'patients.emergency_contact_phone',
        'users.first_name',
        'users.last_name',
        'users.phone',
      );

    // Calculate today's adherence stats and upcoming appointments for each patient
    const enriched = [];
    const today = new Date().toISOString().split('T')[0];

    for (const link of links) {
      // Medications count & taken today
      const meds = await db('medications').where({ patient_id: link.patient_id, is_active: true });
      const dosesToday = await db('medication_doses')
        .where({ patient_id: link.patient_id, status: 'TAKEN' })
        .where('scheduled_time', 'like', `${today}%`);

      // Next appointment
      const nextAppointment = await db('appointments')
        .where({ patient_id: link.patient_id, status: 'CONFIRMED' })
        .where('appointment_date', '>=', today)
        .orderBy('appointment_date', 'asc')
        .first();

      let conditions = [];
      try {
        conditions = typeof link.medical_conditions === 'string' ? JSON.parse(link.medical_conditions) : link.medical_conditions;
      } catch (e) {}

      enriched.push({
        ...link,
        medical_conditions: conditions,
        total_medications: meds.length,
        doses_taken_today: dosesToday.length,
        adherence_percentage: meds.length > 0 ? Math.round((dosesToday.length / meds.length) * 100) : 100,
        next_appointment: nextAppointment || null,
      });
    }

    return success(res, enriched);
  }),
);

module.exports = router;
