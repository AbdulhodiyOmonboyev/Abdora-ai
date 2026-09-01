const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { getFile } = require('../controllers/file.controller');

router.get('/:id', verifyToken, getFile);

module.exports = router;
