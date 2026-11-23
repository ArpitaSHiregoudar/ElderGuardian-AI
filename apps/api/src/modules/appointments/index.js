const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../../config/database');
const { authenticate } = require('../../middleware/auth');
const { asyncHandler, AppError } = require('../../middleware/errorHandler');
const { success } = require('../../utils/response');

const router = Router();

// GET /api/v1/appointments - List appointments for the authenticated user
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { status, type } = req.query;
    let query = db('appointments')
      .join('doctors', 'appointments.doctor_id', 'doctors.id')
      .join('users as doc_user', 'doctors.user_id', 'doc_user.id')
      .leftJoin('specializations', 'doctors.specialization_id', 'specializations.id')
      .join('patients', 'appointments.patient_id', 'patients.id')
      .join('users as pat_user', 'patients.user_id', 'pat_user.id')
      .leftJoin('hospitals', 'appointments.hospital_id', 'hospitals.id');

    if (req.user.role === 'PATIENT') {
      const patient = await db('patients').where({ user_id: req.user.id }).first();
      if (!patient) return success(res, []);
      query = query.where('appointments.patient_id', patient.id);
    } else if (req.user.role === 'DOCTOR') {
      const doctor = await db('doctors').where({ user_id: req.user.id }).first();
      if (!doctor) return success(res, []);
      query = query.where('appointments.doctor_id', doctor.id);
    } else if (req.user.role === 'FAMILY_MEMBER') {
      // Find linked patients with appointment consent
      const links = await db('family_links')
        .where({ family_member_id: req.user.id, consent_status: 'APPROVED' })
        .select('patient_id');
      const patientIds = links.map((l) => l.patient_id);
      query = query.whereIn('appointments.patient_id', patientIds);
    }

    if (status) query = query.where('appointments.status', status);
    if (type) query = query.where('appointments.type', type);

    const appointments = await query
      .select(
        'appointments.*',
        'doc_user.first_name as doctor_first_name',
        'doc_user.last_name as doctor_last_name',
        'specializations.name as specialization_name',
        'hospitals.name as hospital_name',
        'pat_user.first_name as patient_first_name',
        'pat_user.last_name as patient_last_name',
      )
      .orderBy('appointments.appointment_date', 'asc')
      .orderBy('appointments.start_time', 'asc');

    return success(res, appointments);
  }),
);

// POST /api/v1/appointments - Book a new appointment
router.post(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { doctorId, hospitalId, appointmentDate, startTime, endTime, type, reason } = req.body;

    if (!doctorId || !appointmentDate || !startTime) {
      throw new AppError('doctorId, appointmentDate, and startTime are required.', 400, 'VALIDATION_ERROR');
    }

    let patientId;
    if (req.user.role === 'PATIENT') {
      const patient = await db('patients').where({ user_id: req.user.id }).first();
      if (!patient) throw new AppError('Patient profile not found', 404, 'PATIENT_NOT_FOUND');
      patientId = patient.id;
    } else if (req.user.role === 'FAMILY_MEMBER') {
      // Caregiver booking for patient
      const { targetPatientId } = req.body;
      if (!targetPatientId) throw new AppError('targetPatientId required for caregiver booking', 400, 'VALIDATION_ERROR');
      const link = await db('family_links')
        .where({ patient_id: targetPatientId, family_member_id: req.user.id, consent_status: 'APPROVED', can_manage_appointments: true })
        .first();
      if (!link) throw new AppError('Not authorized to book for this patient', 403, 'PERMISSION_DENIED');
      patientId = targetPatientId;
    } else {
      throw new AppError('Only patients or authorized family members can book appointments', 403, 'PERMISSION_DENIED');
    }

    // Check slot collision
    const existing = await db('appointments')
      .where({
        doctor_id: doctorId,
        appointment_date: appointmentDate,
        start_time: startTime,
      })
      .whereNotIn('status', ['CANCELLED', 'RESCHEDULED'])
      .first();

    if (existing) {
      throw new AppError('This time slot is already booked for the selected doctor.', 409, 'SLOT_UNAVAILABLE');
    }

    const appointmentId = uuidv4();
    const now = new Date().toISOString();

    await db('appointments').insert({
      id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
      hospital_id: hospitalId || null,
      appointment_date: appointmentDate,
      start_time: startTime,
      end_time: endTime || '30 mins',
      type: type || 'IN_PERSON',
      status: 'CONFIRMED',
      reason: reason || 'Routine Care Consultation',
      reminder_sent: false,
      created_at: now,
      updated_at: now,
    });

    const appointment = await db('appointments').where({ id: appointmentId }).first();
    return success(res, appointment, 201);
  }),
);

// PATCH /api/v1/appointments/:id/cancel - Cancel appointment
router.patch(
  '/:id/cancel',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const appointment = await db('appointments').where({ id }).first();
    if (!appointment) throw new AppError('Appointment not found', 404, 'NOT_FOUND');

    await db('appointments').where({ id }).update({
      status: 'CANCELLED',
      cancellation_reason: reason || 'Cancelled by user',
      updated_at: new Date().toISOString(),
    });

    return success(res, { message: 'Appointment cancelled successfully' });
  }),
);

module.exports = router;
