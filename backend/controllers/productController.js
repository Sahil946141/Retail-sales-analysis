// src/controllers/productController.js
const dbService = require('../services/dbService');

const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const safeLimit = Math.min(parseInt(limit), 200);
    const safePage = Math.max(parseInt(page), 1);
    
    const query = `SELECT product_id, category, price_per_unit FROM dim.dim_product ORDER BY product_id`;
    const products = await dbService.queryPaginated(query, [], safePage, safeLimit);
    
    res.json({
      success: true,
      data: products.rows,
      pagination: {
        page: products.page,
        limit: products.limit,
        total: products.total,
        totalPages: products.totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch products' 
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        p.product_id, p.category, p.price_per_unit,
        COUNT(fs.transaction_id) as total_sales,
        SUM(fs.quantity) as total_quantity,
        SUM(fs.total_amount) as total_revenue
      FROM dim.dim_product p
      LEFT JOIN fact.fact_sales fs ON p.product_id = fs.product_id
      WHERE p.product_id = $1
      GROUP BY p.product_id, p.category, p.price_per_unit
    `;
    
    const product = await dbService.query(query, [id]);
    
    if (product.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Product not found' 
      });
    }
    
    res.json({
      success: true,
      data: product.rows[0]
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch product' 
    });
  }
};

const getTopCategories = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const query = `
      SELECT 
        p.category,
        COUNT(fs.transaction_id) as transaction_count,
        SUM(fs.quantity) as total_quantity,
        SUM(fs.total_amount) as total_revenue
      FROM fact.fact_sales fs
      JOIN dim.dim_product p ON fs.product_id = p.product_id
      GROUP BY p.category
      ORDER BY total_revenue DESC
      LIMIT $1
    `;
    
    const topCategories = await dbService.query(query, [limit]);
    
    res.json({
      success: true,
      data: topCategories.rows
    });
  } catch (error) {
    console.error('Error fetching top categories:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch top categories' 
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getTopCategories
};