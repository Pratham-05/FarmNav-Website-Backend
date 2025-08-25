const pool = require('../config/db');

const getAllProducts = async (category = null) => {
  let query = `
    SELECT 
      id,
      name,
      description,
      price,
      rating,
      image_url as image,
      category,
      stock_quantity as stock
    FROM products
  `;
  
  const values = [];
  if (category) {
    query += ' WHERE category = $1';
    values.push(category);
  }
  
  query += ' ORDER BY rating DESC';
  
  const { rows } = await pool.query(query, values);
  return rows;
};

const getProductById = async (id) => {
  const query = `
    SELECT 
      id,
      name,
      description,
      price,
      rating,
      image_url as image,
      category,
      stock_quantity as stock
    FROM products
    WHERE id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

const updateProductStock = async (productId, quantity, client) => {
  const query = `
    UPDATE products
    SET stock_quantity = stock_quantity - $1
    WHERE id = $2
    RETURNING stock_quantity
  `;
  const { rows } = await client.query(query, [quantity, productId]);
  return rows[0];
};

module.exports = {
  getAllProducts,
  getProductById,
  updateProductStock
};