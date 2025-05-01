const pool = require('../config/db');

const createOrder = async (userId, orderData) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Generate tracking ID
    const trackingId = `TRK${Math.floor(100000000 + Math.random() * 900000000)}`;
    const status = 'Processing';

    // Insert order
    const orderQuery = `
      INSERT INTO orders (
        user_id, shipping_address, payment_method, 
        subtotal, shipping_cost, total, tracking_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const orderValues = [
      userId,
      orderData.shippingAddress,
      orderData.paymentMethod,
      orderData.subtotal,
      orderData.shippingCost,
      orderData.total,
      trackingId,
      status
    ];
    
    const orderResult = await client.query(orderQuery, orderValues);
    const order = orderResult.rows[0];

    // Insert order items
    for (const item of orderData.cartItems) {
      const itemQuery = `
        INSERT INTO order_items (
          order_id, product_id, product_name, product_price, quantity
        ) VALUES ($1, $2, $3, $4, $5)
      `;
      await client.query(itemQuery, [
        order.id,
        item.id,
        item.name,
        item.price,
        item.quantity
      ]);
    }

    await client.query('COMMIT');
    return order;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in createOrder:', error);
    throw error;
  } finally {
    client.release();
  }
};

const getOrderDetails = async (userId, orderId) => {
  const client = await pool.connect();
  
  try {
    // Get order with formatted dates
    const orderQuery = `
      SELECT 
        id,
        user_id,
        to_char(order_date, 'DD Mon YYYY') as order_date,
        status,
        shipping_address,
        payment_method,
        subtotal,
        shipping_cost,
        total,
        tracking_id,
        to_char(
          order_date + interval '5 days', 
          'DD Mon YYYY'
        ) as expected_delivery
      FROM orders 
      WHERE id = $1 AND user_id = $2
    `;
    const orderResult = await client.query(orderQuery, [orderId, userId]);
    
    if (orderResult.rows.length === 0) {
      return null;
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsQuery = `
      SELECT 
        product_id as id,
        product_name as name,
        product_price as price,
        quantity
      FROM order_items
      WHERE order_id = $1
    `;
    const itemsResult = await client.query(itemsQuery, [orderId]);
    order.items = itemsResult.rows;

    return order;
  } catch (error) {
    console.error('Error in getOrderDetails:', error);
    throw error;
  } finally {
    client.release();
  }
};

const getOrdersByUser = async (userId) => {
  const client = await pool.connect();
  
  try {
    // Get orders with formatted dates
    const ordersQuery = `
      SELECT 
        id,
        to_char(order_date, 'DD Mon YYYY') as order_date,
        status,
        shipping_address,
        payment_method,
        subtotal,
        shipping_cost,
        total,
        tracking_id
      FROM orders 
      WHERE user_id = $1
      ORDER BY order_date DESC
    `;
    const ordersResult = await client.query(ordersQuery, [userId]);
    const orders = ordersResult.rows;

    // Get order items for each order
    for (const order of orders) {
      const itemsQuery = `
        SELECT 
          product_id as id,
          product_name as name,
          product_price as price,
          quantity
        FROM order_items
        WHERE order_id = $1
      `;
      const itemsResult = await client.query(itemsQuery, [order.id]);
      order.items = itemsResult.rows;
    }

    return orders;
  } catch (error) {
    console.error('Error in getOrdersByUser:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createOrder,
  getOrderDetails,
  getOrdersByUser
};