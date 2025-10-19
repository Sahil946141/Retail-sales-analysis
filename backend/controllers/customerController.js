// src/controllers/customerController.js
const dbService = require('../services/dbService');

const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const safeLimit = Math.min(parseInt(limit), 100);
    const safePage = Math.max(parseInt(page), 1);
    
    const query = `SELECT customer_id, customer_code, gender, age FROM dim.dim_customer ORDER BY customer_id`;
    const customers = await dbService.queryPaginated(query, [], safePage, safeLimit);
    
    res.json({
      success: true,
      data: customers.rows,
      pagination: {
        page: customers.page,
        limit: customers.limit,
        total: customers.total,
        totalPages: customers.totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch customers' 
    });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `SELECT customer_id, customer_code, gender, age FROM dim.dim_customer WHERE customer_id = $1`;
    const customer = await dbService.query(query, [id]);
    
    if (customer.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Customer not found' 
      });
    }
    
    res.json({
      success: true,
      data: customer.rows[0]
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch customer' 
    });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById
};