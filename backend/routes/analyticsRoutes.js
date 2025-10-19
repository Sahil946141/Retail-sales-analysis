// src/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/kpis', analyticsController.getKPIs);
router.get('/trends', analyticsController.getSalesTrends);
router.get('/top-customers', analyticsController.getTopCustomers);
router.get('/daily-sales', analyticsController.getDailySales);
// router.get('/simple-forecast', analyticsController.getSimpleForecast); // ✅ Add this

module.exports = router;