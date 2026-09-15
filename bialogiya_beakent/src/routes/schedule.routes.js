const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { getSchedule } = require('../controllers/schedule.controller');

router.get('/', verifyToken, getSchedule);

module.exports = router;
