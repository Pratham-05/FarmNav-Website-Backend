require('dotenv').config();
const nodemailer = require('nodemailer');
const { createLogger, format, transports } = require('winston');

// Configure logging
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/email-service.log' })
  ]
});

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  },
  logger: true
});

// Simple number formatter without toFixed()
const formatNumber = (num) => {
  if (typeof num === 'number') {
    return num.toString();
  }
  if (typeof num === 'string') {
    return num;
  }
  return '0';
};

// Simple currency formatter without toFixed()
const formatCurrency = (amount) => {
  return '₹' + formatNumber(amount);
};

const sendOrderConfirmationEmail = async (orderData) => {
  try {
    // Safely extract values
    const safeData = {
      id: orderData.id || 'N/A',
      paymentMethod: orderData.paymentMethod || 'Unknown',
      total: orderData.total || 0,
      shippingAddress: orderData.shippingAddress || 'Not provided',
      items: Array.isArray(orderData.items) ? orderData.items : [],
      orderDate: orderData.orderDate ? new Date(orderData.orderDate) : new Date()
    };

    logger.info(`Sending email for order #${safeData.id}`);

    const mailOptions = {
      from: `FarmNav Orders <${process.env.GMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || 'farmnav2024@gmail.com',
      subject: `New Order #${safeData.id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">New Order Notification</h2>
          <p><strong>Order ID:</strong> ${safeData.id}</p>
          <p><strong>Date:</strong> ${safeData.orderDate.toLocaleString()}</p>
          <p><strong>Total:</strong> ${formatCurrency(safeData.total)}</p>
          <p><strong>Payment Method:</strong> ${safeData.paymentMethod}</p>
          <p><strong>Shipping Address:</strong></p>
          <p>${safeData.shippingAddress.replace(/\n/g, '<br>')}</p>
          <h3>Order Items:</h3>
          <ul>
            ${safeData.items.map(item => `
              <li>
                ${item.name || 'Item'} - ${item.quantity || 0} × ${formatCurrency(item.price || 0)}
              </li>
            `).join('')}
          </ul>
        </div>
      `,
      text: `
        New Order Notification
        ----------------------
        Order ID: ${safeData.id}
        Date: ${safeData.orderDate.toLocaleString()}
        Total: ${formatCurrency(safeData.total)}
        Payment Method: ${safeData.paymentMethod}
        Shipping Address: ${safeData.shippingAddress}
        
        Order Items:
        ${safeData.items.map(item => 
          `${item.name || 'Item'} - ${item.quantity || 0} × ${formatCurrency(item.price || 0)}`
        ).join('\n')}
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully for order #${safeData.id}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send email: ${error.message}`);
    throw error;
  }
};

module.exports = { sendOrderConfirmationEmail };