const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../../config/database');
const { authenticate } = require('../../middleware/auth');
const { asyncHandler, AppError } = require('../../middleware/errorHandler');
const { success } = require('../../utils/response');

const router = Router();

// GET /api/v1/prescriptions
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    let query = db('prescriptions')
      .join('doctors', 'prescriptions.doctor_id', 'doctors.id')
      .join('users as doc_user', 'doctors.user_id', 'doc_user.id')
      .leftJoin('hospitals', 'prescriptions.hospital_id', 'hospitals.id');

    if (req.user.role === 'PATIENT') {
      const patient = await db('patients').where({ user_id: req.user.id }).first();
      if (!patient) return success(res, []);
      query = query.where('prescriptions.patient_id', patient.id);
    } else if (req.user.role === 'DOCTOR') {
      const doctor = await db('doctors').where({ user_id: req.user.id }).first();
      if (!doctor) return success(res, []);
      query = query.where('prescriptions.doctor_id', doctor.id);
    }

    const prescriptions = await query.select(
      'prescriptions.*',
      'doc_user.first_name as doctor_first_name',
      'doc_user.last_name as doctor_last_name',
      'hospitals.name as hospital_name',
    ).orderBy('prescriptions.prescription_date', 'desc');

    // Fetch items for each prescription
    for (const rx of prescriptions) {
      rx.items = await db('prescription_items').where({ prescription_id: rx.id });
    }

    return success(res, prescriptions);
  }),
);

// POST /api/v1/prescriptions - Doctor creates a new prescription
router.post(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { patientId, hospitalId, diagnosis, notes, prescriptionDate, validUntil, items } = req.body;

    let doctorId;
    if (req.user.role === 'DOCTOR') {
      const doctor = await db('doctors').where({ user_id: req.user.id }).first();
      if (!doctor) throw new AppError('Doctor profile not found', 404, 'NOT_FOUND');
      doctorId = doctor.id;
    } else {
      throw new AppError('Only doctors can create formal prescriptions', 403, 'PERMISSION_DENIED');
    }

    const prescriptionId = uuidv4();
    const now = new Date().toISOString();

    await db.transaction(async (trx) => {
      await trx('prescriptions').insert({
        id: prescriptionId,
        patient_id: patientId,
        doctor_id: doctorId,
        hospital_id: hospitalId || null,
        diagnosis,
        notes,
        prescription_date: prescriptionDate || now.split('T')[0],
        valid_until: validUntil || null,
        status: 'ACTIVE',
        version: 1,
        created_at: now,
        updated_at: now,
      });

      if (items && Array.isArray(items)) {
        for (const item of items) {
          const itemId = uuidv4();
          await trx('prescription_items').insert({
            id: itemId,
            prescription_id: prescriptionId,
            medicine_name: item.medicineName,
            generic_name: item.genericName || null,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration || '30 days',
            quantity: item.quantity || 30,
            timing: item.timing || 'after meals',
            instructions: item.instructions || null,
            is_active: true,
            created_at: now,
            updated_at: now,
          });

          // Automatically sync to active medications for the patient!
          await trx('medications').insert({
            id: uuidv4(),
            patient_id: patientId,
            prescription_item_id: itemId,
            medicine_name: item.medicineName,
            dosage: item.dosage,
            frequency: item.frequency,
            schedule_times: JSON.stringify(item.scheduleTimes || ['08:00', '20:00']),
            start_date: prescriptionDate || now.split('T')[0],
            is_active: true,
            total_quantity: item.quantity || 30,
            remaining_quantity: item.quantity || 30,
            refill_reminder_days: 7,
            notes: item.instructions || null,
            created_at: now,
            updated_at: now,
          });
        }
      }
    });

    return success(res, { message: 'Prescription created successfully', prescriptionId }, 201);
  }),
);

module.exports = router;
