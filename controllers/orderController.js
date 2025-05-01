const orderModel = require('../models/orderModel');
const { sendOrderConfirmationEmail } = require('../services/emailService');

const createOrder = async (req, res) => {
  try {
    // Session validation
    if (!req.session?.user?.id) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    // Destructure with defaults
    const { 
      paymentMethod = 'Unknown',
      cartItems = [],
      subtotal = 0,
      shippingCost = 0,
      total = 0,
      shippingAddress = 'Not provided'
    } = req.body;

    // Validate required fields
    if (!paymentMethod || !Array.isArray(cartItems) || !shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Missing required order fields'
      });
    }

    // Convert all numeric values with validation
    const numericSubtotal = Math.max(0, Number(subtotal));
    const numericShippingCost = Math.max(0, Number(shippingCost));
    const numericTotal = Math.max(0, Number(total));

    // Verify numeric conversions
    if (isNaN(numericSubtotal) || isNaN(numericShippingCost) || isNaN(numericTotal)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid numeric values in order data'
      });
    }

    // Create order in database
    const order = await orderModel.createOrder(req.session.user.id, {
      paymentMethod,
      cartItems: cartItems.map(item => ({
        ...item,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 0
      })),
      subtotal: numericSubtotal,
      shippingCost: numericShippingCost,
      total: numericTotal,
      shippingAddress
    });

    // Prepare data for email with additional validation
    const emailData = {
      id: order.id.toString(),
      paymentMethod: order.payment_method || paymentMethod,
      total: Number(order.total) || numericTotal,
      shippingAddress: order.shipping_address || shippingAddress,
      items: (order.cartItems || cartItems).map(item => ({
        name: String(item.name || 'Unknown Product'),
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 0
      })),
      orderDate: order.order_date || new Date()
    };

    // Send confirmation email (fire-and-forget)
    sendOrderConfirmationEmail(emailData)
      .catch(emailError => {
        console.error('Email sending failed (non-blocking):', emailError);
      });

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