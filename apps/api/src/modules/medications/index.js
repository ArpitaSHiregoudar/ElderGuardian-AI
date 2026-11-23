const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../../config/database');
const { authenticate } = require('../../middleware/auth');
const { asyncHandler, AppError } = require('../../middleware/errorHandler');
const { success } = require('../../utils/response');

const router = Router();

// GET /api/v1/medications/today - Today's schedule with adherence state
router.get(
  '/today',
  authenticate,
  asyncHandler(async (req, res) => {
    let patientId;
    if (req.user.role === 'PATIENT') {
      const patient = await db('patients').where({ user_id: req.user.id }).first();
      if (!patient) return success(res, []);
      patientId = patient.id;
    } else if (req.user.role === 'FAMILY_MEMBER') {
      const { patientId: targetId } = req.query;
      if (!targetId) throw new AppError('patientId required for family member query', 400, 'VALIDATION_ERROR');
      patientId = targetId;
    } else {
      throw new AppError('Unauthorized', 403, 'PERMISSION_DENIED');
    }

    const medications = await db('medications')
      .where({ patient_id: patientId, is_active: true })
      .select('*')
      .orderBy('medicine_name', 'asc');

    // Get today's doses recorded
    const today = new Date().toISOString().split('T')[0];
    const dosesToday = await db('medication_doses')
      .where({ patient_id: patientId })
      .where('scheduled_time', 'like', `${today}%`)
      .select('*');

    const result = medications.map((med) => {
      let times = [];
      try {
        times = typeof med.schedule_times === 'string' ? JSON.parse(med.schedule_times) : med.schedule_times;
      } catch (e) {
        times = ['08:00'];
      }

      const medDoses = dosesToday.filter((d) => d.medication_id === med.id);

      return {
        ...med,
        schedule_times: times,
        doses_today: medDoses,
        status_today: medDoses.length > 0 ? medDoses[medDoses.length - 1].status : 'PENDING',
      };
    });

    return success(res, result);
  }),
);

// POST /api/v1/medications/:id/dose - Record dose taken/skipped/missed
router.post(
  '/:id/dose',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, skippedReason, notes } = req.body;

    if (!['TAKEN', 'SKIPPED', 'MISSED'].includes(status)) {
      throw new AppError('Status must be TAKEN, SKIPPED, or MISSED', 400, 'VALIDATION_ERROR');
    }

    const medication = await db('medications').where({ id }).first();
    if (!medication) throw new AppError('Medication not found', 404, 'NOT_FOUND');

    const doseId = uuidv4();
    const now = new Date().toISOString();

    await db.transaction(async (trx) => {
      await trx('medication_doses').insert({
        id: doseId,
        medication_id: id,
        patient_id: medication.patient_id,
        scheduled_time: now,
        status,
        taken_at: status === 'TAKEN' ? now : null,
        skipped_reason: skippedReason || null,
        notes: notes || null,
        created_at: now,
      });

      // If TAKEN, decrement remaining quantity
      if (status === 'TAKEN' && medication.remaining_quantity > 0) {
        await trx('medications')
          .where({ id })
          .update({
            remaining_quantity: medication.remaining_quantity - 1,
            updated_at: now,
          });
      }
    });

    return success(res, { message: `Medication dose recorded as ${status}`, doseId }, 201);
  }),
);

// GET /api/v1/medications - List all medications for a patient
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    let patientId;
    if (req.user.role === 'PATIENT') {
      const patient = await db('patients').where({ user_id: req.user.id }).first();
      if (!patient) return success(res, []);
      patientId = patient.id;
    } else {
      const { patientId: targetId } = req.query;
      patientId = targetId;
    }

    const meds = await db('medications').where({ patient_id: patientId }).select('*');
    return success(res, meds);
  }),
);

module.exports = router;
