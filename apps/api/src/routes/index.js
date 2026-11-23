const { Router } = require('express');
const authRoutes = require('../modules/auth');
const patientRoutes = require('../modules/patients');
const directoryRoutes = require('../modules/directory');
const appointmentRoutes = require('../modules/appointments');
const medicationRoutes = require('../modules/medications');
const prescriptionRoutes = require('../modules/prescriptions');
const familyRoutes = require('../modules/family');

const router = Router();

// ─── Module routes ───────────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/directory', directoryRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/medications', medicationRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/family', familyRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ElderGuardian AI Core API',
    version: '1.0.0-PROD',
  });
});

module.exports = router;
