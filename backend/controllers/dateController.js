// src/controllers/dateController.js
const dbService = require('../services/dbService');

const getAllDates = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT date_id, full_date, year, month, quarter 
      FROM dim.dim_date 
      ORDER BY full_date DESC
    `;
    const dates = await dbService.query(query);
    
    res.json({
      success: true,
      data: dates.rows
    });
  } catch (error) {
    console.error('Error fetching dates:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dates' 
    });
  }
};

const getDatesByYear = async (req, res) => {
  try {
    const { year } = req.params;
    const query = `
      SELECT date_id, full_date, year, month, quarter 
      FROM dim.dim_date 
      WHERE year = $1 
      ORDER BY full_date ASC
    `;
    const dates = await dbService.query(query, [year]);
    
    res.json({
      success: true,
      data: dates.rows
    });
  } catch (error) {
    console.error('Error fetching dates by year:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dates by year' 
    });
  }
};

const getDatesByMonth = async (req, res) => {
  try {
    const { year, month } = req.params;
    const query = `
      SELECT date_id, full_date, year, month, quarter 
      FROM dim.dim_date 
      WHERE year = $1 AND month = $2 
      ORDER BY full_date ASC
    `;
    const dates = await dbService.query(query, [year, month]);
    
    res.json({
      success: true,
      data: dates.rows
    });
  } catch (error) {
    console.error('Error fetching dates by month:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dates by month' 
    });
  }
};

module.exports = {
  getAllDates,
  getDatesByYear,
  getDatesByMonth
};