// src/services/mlService.js
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

const getSalesForecast = async (periods = 12) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/forecast`, { params: { periods } });
    return response.data;
  } catch (error) {
    console.error('ML service error:', error.message);
    throw new Error('ML service unavailable');
  }
};


const getCustomerClusters = async () => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/clusters`);
    return response.data;
  } catch (error) {
    console.error('ML service error:', error.message);
    throw new Error('ML service unavailable');
  }
};

module.exports = {
  getSalesForecast,
  getCustomerClusters
};