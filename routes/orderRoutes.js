const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const orderController = require('../controllers/orderController');

// Protected routes
router.post('/', authMiddleware.isAuthenticated, orderController.createOrder);
router.get('/', authMiddleware.isAuthenticated, orderController.getUserOrders);
router.get('/:id', authMiddleware.isAuthenticated, orderController.getOrderDetails);

module.exports = router;