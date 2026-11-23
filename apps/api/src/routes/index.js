const { Router } = require('express');
const authRoutes = require('../modules/auth');

const router = Router();

// ─── Module routes ───────────────────────────────────────────────────
router.use('/auth', authRoutes);

// TODO: mount additional module routes below
// router.use('/patients', patientRoutes);
// router.use('/doctors', doctorRoutes);
// router.use('/hospitals', hospitalRoutes);
// router.use('/appointments', appointmentRoutes);
// router.use('/prescriptions', prescriptionRoutes);
// router.use('/medications', medicationRoutes);
// router.use('/health-readings', healthReadingRoutes);
// router.use('/notifications', notificationRoutes);

module.exports = router;
