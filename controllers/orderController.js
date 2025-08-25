const orderModel = require('../models/orderModel');
const { sendOrderConfirmationEmail } = require('../services/emailService');

const createOrder = async (req, res) => {
  try {
    if (!req.session?.user?.id) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    const { 
      paymentMethod = 'Unknown',
      cartItems = [],
      subtotal = 0,
      shippingCost = 0,
      total = 0,
      shippingAddress = 'Not provided'
    } = req.body;

    // Validate required fields
    if (!paymentMethod || !Array.isArray(cartItems) || cartItems.length === 0 || !shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Missing required order fields'
      });
    }

    // Validate cart items
    for (const item of cartItems) {
      if (!item.id || !item.name || item.price === undefined || item.quantity === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cart items format'
        });
      }
    }

    // Create order
    const order = await orderModel.createOrder(req.session.user.id, {
      paymentMethod,
      cartItems,
      subtotal: Math.max(0, Number(subtotal)),
      shippingCost: Math.max(0, Number(shippingCost)),
      total: Math.max(0, Number(total)),
      shippingAddress
    });

    // Send confirmation email
    sendOrderConfirmationEmail({
      id: order.id,
      paymentMethod: order.payment_method,
      total: order.total,
      shippingAddress: order.shipping_address,
      items: cartItems,
      orderDate: order.order_date
    }).catch(err => console.error('Email sending failed:', err));

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });

  } catch (error) {
    console.error('Order creation failed:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to create order',
      error: error.message 
    });
  }
};

const getUserOrders = async (req, res) => {
  try {
    if (!req.session.user?.id) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    const orders = await orderModel.getOrdersByUser(req.session.user.id);
    return res.status(200).json({
      success: true,
      orders: orders.map(order => ({
        ...order,
        total: Number(order.total) || 0,
        subtotal: Number(order.subtotal) || 0
      }))
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    if (!req.session.user?.id) {
      return res.status(401).json({ 
        success: false,
        message: 'Not authenticated' 
      });
    }

    const orderId = req.params.id;
    const order = await orderModel.getOrderDetails(req.session.user.id, orderId);

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    // Ensure numeric values in response
    const formattedOrder = {
      ...order,
      total: Number(order.total) || 0,
      subtotal: Number(order.subtotal) || 0,
      items: order.items.map(item => ({
        ...item,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 0
      }))
    };

    return res.status(200).json({
      success: true,
      order: formattedOrder
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching order details',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderDetails
};