const { Router } = require('express');
const controller = require('./auth.controller');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { registerSchema, loginSchema, refreshTokenSchema } = require('./auth.validation');

const router = Router();

router.post('/register', validate(registerSchema), controller.register);
router.post('/login', validate(loginSchema), controller.login);
router.post('/refresh-token', validate(refreshTokenSchema), controller.refreshToken);
router.post('/logout', controller.logout);
router.get('/me', authenticate, controller.getMe);

module.exports = router;
