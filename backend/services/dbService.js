// src/services/dbService.js
const pool = require('../config/db');

const query = (text, params) => {
  return pool.query(text, params);
};

const queryPaginated = async (text, params, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const paginatedText = `${text} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const paginatedParams = [...params, limit, offset];
  
  const result = await pool.query(paginatedText, paginatedParams);
  
  // Get total count
  const countText = `SELECT COUNT(*) FROM (${text}) as count_query`;
  const countResult = await pool.query(countText, params);
  const total = parseInt(countResult.rows[0].count);
  
  return {
    rows: result.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

module.exports = {
  query,
  queryPaginated
};