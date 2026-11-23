const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../../config/database');
const { authenticate } = require('../../middleware/auth');
const { asyncHandler, AppError } = require('../../middleware/errorHandler');
const { success } = require('../../utils/response');

const router = Router();

// GET /api/v1/directory/hospitals
router.get(
  '/hospitals',
  asyncHandler(async (req, res) => {
    const { city, search } = req.query;
    let query = db('hospitals').whereNull('deleted_at').where({ is_active: true });

    if (city) {
      query = query.whereILike('city', `%${city}%`);
    }
    if (search) {
      query = query.andWhere((builder) => {
        builder.whereILike('name', `%${search}%`).orWhereILike('description', `%${search}%`);
      });
    }

    const hospitals = await query.select('*').orderBy('rating', 'desc');
    return success(res, hospitals);
  }),
);

// GET /api/v1/directory/specializations
router.get(
  '/specializations',
  asyncHandler(async (req, res) => {
    const specializations = await db('specializations').select('*').orderBy('name', 'asc');
    return success(res, specializations);
  }),
);

// GET /api/v1/directory/doctors
router.get(
  '/doctors',
  asyncHandler(async (req, res) => {
    const { specializationId, hospitalId, search } = req.query;

    let query = db('doctors')
      .join('users', 'doctors.user_id', 'users.id')
      .leftJoin('specializations', 'doctors.specialization_id', 'specializations.id')
      .whereNull('doctors.deleted_at')
      .where('doctors.is_available', true);

    if (specializationId) {
      query = query.where('doctors.specialization_id', specializationId);
    }

    if (hospitalId) {
      query = query
        .join('hospital_doctors', 'doctors.id', 'hospital_doctors.doctor_id')
        .where('hospital_doctors.hospital_id', hospitalId);
    }

    if (search) {
      query = query.andWhere((b) => {
        b.whereILike('users.first_name', `%${search}%`)
          .orWhereILike('users.last_name', `%${search}%`)
          .orWhereILike('specializations.name', `%${search}%`);
      });
    }

    const doctors = await query.select(
      'doctors.*',
      'users.first_name',
      'users.last_name',
      'users.email',
      'users.phone',
      'users.avatar_url',
      'specializations.name as specialization_name',
    );

    return success(res, doctors);
  }),
);

module.exports = router;
