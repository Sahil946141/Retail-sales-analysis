// src/controllers/analyticsController.js
const dbService = require('../services/dbService');

// ------------------- KPIs -------------------
const getKPIs = async (req, res) => {
  try {
    const kpiQueries = [
      `SELECT SUM(total_amount) as total_revenue FROM fact.fact_sales`,
      `SELECT COUNT(*) as total_customers FROM dim.dim_customer`,
      `SELECT COUNT(*) as total_transactions FROM fact.fact_sales`,
      `SELECT AVG(total_amount) as avg_order_value FROM fact.fact_sales`,
      `SELECT COUNT(*) as total_products FROM dim.dim_product`
    ];

    const results = await Promise.all(kpiQueries.map(query => dbService.query(query)));

    const kpis = {
      totalRevenue: parseFloat(results[0].rows[0].total_revenue) || 0,
      totalCustomers: parseInt(results[1].rows[0].total_customers),
      totalTransactions: parseInt(results[2].rows[0].total_transactions),
      averageOrderValue: parseFloat(results[3].rows[0].avg_order_value) || 0,
      totalProducts: parseInt(results[4].rows[0].total_products)
    };

    res.json({ success: true, data: kpis });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch KPIs' });
  }
};

// ------------------- SALES TRENDS -------------------
const getSalesTrends = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    let query;

    if (period === 'quarterly') {
      query = `
        SELECT 
          d.year,
          d.quarter,
          SUM(fs.total_amount) as revenue,
          COUNT(fs.transaction_id) as transactions,
          AVG(fs.total_amount) as avg_order_value
        FROM fact.fact_sales fs
        JOIN dim.dim_date d ON fs.date_id = d.date_id
        GROUP BY d.year, d.quarter
        ORDER BY d.year, d.quarter
      `;
    } else {
      query = `
        SELECT 
          d.year,
          d.month,
          SUM(fs.total_amount) as revenue,
          COUNT(fs.transaction_id) as transactions,
          AVG(fs.total_amount) as avg_order_value
        FROM fact.fact_sales fs
        JOIN dim.dim_date d ON fs.date_id = d.date_id
        GROUP BY d.year, d.month
        ORDER BY d.year, d.month
      `;
    }

    const trends = await dbService.query(query);
    res.json({ success: true, data: trends.rows, period });
  } catch (error) {
    console.error('Error fetching sales trends:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sales trends' });
  }
};

// ------------------- TOP CUSTOMERS -------------------
const getTopCustomers = async (req, res) => {
  try {
    const { limit = 20, cluster } = req.query;
    
    let query;
    let params = [limit];
    
    if (cluster && cluster !== 'all') {
      // Get top customers for specific cluster
      query = `
        WITH customer_clusters AS (
          SELECT 
            customer_id,
            CASE 
              WHEN total_spent > 10000 THEN 0  -- High Value
              WHEN total_orders > 15 THEN 1     -- Loyal
              WHEN total_spent < 1000 OR total_orders < 5 THEN 2  -- New
              ELSE 3  -- At Risk
            END as cluster_id
          FROM (
            SELECT 
              c.customer_id,
              SUM(fs.total_amount) as total_spent,
              COUNT(fs.transaction_id) as total_orders
            FROM fact.fact_sales fs
            JOIN dim.dim_customer c ON fs.customer_id = c.customer_id
            GROUP BY c.customer_id
          ) customer_stats
        )
        SELECT 
          c.customer_id, 
          c.customer_code, 
          c.gender, 
          c.age,
          SUM(fs.total_amount) as total_spent,
          COUNT(fs.transaction_id) as total_orders,
          cc.cluster_id
        FROM fact.fact_sales fs
        JOIN dim.dim_customer c ON fs.customer_id = c.customer_id
        JOIN customer_clusters cc ON c.customer_id = cc.customer_id
        WHERE cc.cluster_id = $1
        GROUP BY c.customer_id, c.customer_code, c.gender, c.age, cc.cluster_id
        ORDER BY total_spent DESC
        LIMIT $2
      `;
      params = [parseInt(cluster), limit];
    } else {
      // Get all top customers
      query = `
        SELECT 
          c.customer_id, 
          c.customer_code, 
          c.gender, 
          c.age,
          SUM(fs.total_amount) as total_spent,
          COUNT(fs.transaction_id) as total_orders,
          CASE 
            WHEN SUM(fs.total_amount) > 10000 THEN 0  -- High Value
            WHEN COUNT(fs.transaction_id) > 15 THEN 1  -- Loyal
            WHEN SUM(fs.total_amount) < 1000 OR COUNT(fs.transaction_id) < 5 THEN 2  -- New
            ELSE 3  -- At Risk
          END as cluster_id
        FROM fact.fact_sales fs
        JOIN dim.dim_customer c ON fs.customer_id = c.customer_id
        GROUP BY c.customer_id, c.customer_code, c.gender, c.age
        ORDER BY total_spent DESC
        LIMIT $1
      `;
    }
    
    const topCustomers = await dbService.query(query, params);
    res.json({ success: true, data: topCustomers.rows });
  } catch (error) {
    console.error('Error fetching top customers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch top customers' });
  }
};

// ------------------- DAILY SALES -------------------
const getDailySales = async (req, res) => {
  try {
    const query = `
  SELECT 
  dd.day AS day,
  SUM(fs.total_amount) AS sales,
  COUNT(fs.transaction_id) AS transactions
FROM dim.dim_date dd
LEFT JOIN fact.fact_sales fs ON fs.date_id = dd.date_id
GROUP BY dd.day
ORDER BY dd.day
LIMIT 30`;

    const result = await dbService.query(query);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching daily sales:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch daily sales data' });
  }
};

// Add this to your analyticsController.js
// const getSimpleForecast = async (req, res) => {
//   try {
//     const { periods = 12 } = req.query;
    
//     // Simple SQL-based forecasting using moving averages
//     const query = `
//       WITH monthly_sales AS (
//         SELECT 
//           d.year,
//           d.month,
//           SUM(fs.total_amount) as monthly_revenue,
//           AVG(SUM(fs.total_amount)) OVER (ORDER BY d.year, d.month ROWS BETWEEN 3 PRECEDING AND CURRENT ROW) as moving_avg
//         FROM fact.fact_sales fs
//         JOIN dim.dim_date d ON fs.date_id = d.date_id
//         GROUP BY d.year, d.month
//         ORDER BY d.year, d.month DESC
//         LIMIT 12
//       ),
//       forecast_data AS (
//         SELECT 
//           AVG(monthly_revenue) as avg_revenue,
//           STDDEV(monthly_revenue) as revenue_stddev
//         FROM monthly_sales
//       )
//       SELECT 
//         avg_revenue as forecast,
//         avg_revenue - (revenue_stddev * 0.5) as confidence_lower,
//         avg_revenue + (revenue_stddev * 0.5) as confidence_upper
//       FROM forecast_data
//     `;
    
//     const result = await dbService.query(query);
//     const baseForecast = result.rows[0];
    
//     // Generate clean forecast periods
//     const forecast = [];
//     for (let i = 1; i <= periods; i++) {
//       const growthFactor = 1 + (i * 0.015); // 1.5% monthly growth
//       forecast.push({
//         period: i,
//         forecast: Math.round(baseForecast.forecast * growthFactor),
//         confidence_lower: Math.round(baseForecast.confidence_lower * growthFactor),
//         confidence_upper: Math.round(baseForecast.confidence_upper * growthFactor)
//       });
//     }
    
//     res.json({
//       success: true,
//       data: forecast,
//       note: "Simple moving average forecast"
//     });
    
//   } catch (error) {
//     console.error('Error in simple forecast:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to generate simple forecast'
//     });
//   }
// };
// const getSalesHeatmap = async (req, res) => {
//   try {
//     const query = `
//       SELECT 
//           p.category,
//           c.gender AS customer_segment,
//           SUM(fs.total_amount) AS sales
//       FROM fact.fact_sales fs
//       JOIN dim.dim_product p ON fs.product_id = p.product_id
//       JOIN dim.dim_customer c ON fs.customer_id = c.customer_id
//       GROUP BY p.category, c.gender
//       ORDER BY p.category, c.gender;
//     `;
//     const result = await dbService.query(query);
//     res.json({ success: true, data: result.rows });
//   } catch (error) {
//     console.error('Error fetching sales heatmap:', error);
//     res.status(500).json({ success: false, error: 'Failed to fetch sales heatmap data' });
//   }
// };

// ✅ EXPORT EVERYTHING HERE
module.exports = {
  getKPIs,
  getSalesTrends,
  getTopCustomers,
  getDailySales
};
