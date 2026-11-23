const { Router } = require('express');
const { db } = require('../../config/database');
const { authenticate, authorize } = require('../../middleware/auth');
const { asyncHandler, AppError } = require('../../middleware/errorHandler');
const { success } = require('../../utils/response');

const router = Router();

// GET /api/v1/patients/me - Get current logged in patient profile
router.get(
  '/me',
  authenticate,
  authorize('PATIENT'),
  asyncHandler(async (req, res) => {
    const patient = await db('patients')
      .join('users', 'patients.user_id', 'users.id')
      .where('users.id', req.user.id)
      .whereNull('users.deleted_at')
      .select(
        'patients.*',
        'users.first_name',
        'users.last_name',
        'users.email',
        'users.phone',
        'users.avatar_url',
      )
      .first();

    if (!patient) {
      throw new AppError('Patient profile not found', 404, 'PATIENT_NOT_FOUND');
    }

    // Parse JSON fields
    if (patient.medical_conditions && typeof patient.medical_conditions === 'string') {
      try { patient.medical_conditions = JSON.parse(patient.medical_conditions); } catch (e) {}
    }
    if (patient.allergies && typeof patient.allergies === 'string') {
      try { patient.allergies = JSON.parse(patient.allergies); } catch (e) {}
    }

    return success(res, patient);
  }),
);

// PUT /api/v1/patients/me - Update patient profile
router.put(
  '/me',
  authenticate,
  authorize('PATIENT'),
  asyncHandler(async (req, res) => {
    const {
      dateOfBirth,
      gender,
      bloodGroup,
      heightCm,
      weightKg,
      emergencyContactName,
      emergencyContactPhone,
      medicalConditions,
      allergies,
      address,
      city,
      state,
      pincode,
      abhaId,
    } = req.body;

    const patient = await db('patients').where({ user_id: req.user.id }).first();
    if (!patient) {
      throw new AppError('Patient profile not found', 404, 'PATIENT_NOT_FOUND');
    }

    const updateData = {
      updated_at: new Date().toISOString(),
    };
    if (dateOfBirth !== undefined) updateData.date_of_birth = dateOfBirth;
    if (gender !== undefined) updateData.gender = gender;
    if (bloodGroup !== undefined) updateData.blood_group = bloodGroup;
    if (heightCm !== undefined) updateData.height_cm = heightCm;
    if (weightKg !== undefined) updateData.weight_kg = weightKg;
    if (emergencyContactName !== undefined) updateData.emergency_contact_name = emergencyContactName;
    if (emergencyContactPhone !== undefined) updateData.emergency_contact_phone = emergencyContactPhone;
    if (medicalConditions !== undefined) updateData.medical_conditions = JSON.stringify(medicalConditions);
    if (allergies !== undefined) updateData.allergies = JSON.stringify(allergies);
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (abhaId !== undefined) updateData.abha_id = abhaId;

    await db('patients').where({ id: patient.id }).update(updateData);
    const updated = await db('patients').where({ id: patient.id }).first();

    return success(res, updated);
  }),
);

module.exports = router;
