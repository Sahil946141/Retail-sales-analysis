// src/routes/mlRoutes.js
const express = require('express');
const router = express.Router();
const mlController = require('../controllers/mlController');

router.get('/forecast', mlController.getForecast);
router.get('/clusters', mlController.getClusters);

module.exports = router;