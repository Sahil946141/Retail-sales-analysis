// src/routes/dateRoutes.js
const express = require('express');
const router = express.Router();
const dateController = require('../controllers/dateController');

router.get('/', dateController.getAllDates);
router.get('/:year', dateController.getDatesByYear);
router.get('/:year/:month', dateController.getDatesByMonth);

module.exports = router;