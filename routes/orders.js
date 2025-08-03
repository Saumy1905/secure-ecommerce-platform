const express = require('express');
const { check } = require('express-validator');
const { 
  createOrder, 
  getOrders, 
  getOrder,
  updateOrder,
  getAllOrders,
  cancelOrder
} = require('../controllers/orders');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const orderValidation = [
  check('shippingAddress.name', 'Name is required').not().isEmpty(),
  check('shippingAddress.address', 'Address is required').not().isEmpty(),
  check('shippingAddress.city', 'City is required').not().isEmpty(),
  check('shippingAddress.state', 'State is required').not().isEmpty(),
  check('shippingAddress.postalCode', 'Postal code is required').not().isEmpty(),
  check('shippingAddress.phone', 'Phone number is required').not().isEmpty(),
  check('paymentMethod', 'Payment method is required').isIn(['upi', 'cod'])
];

router.post('/', orderValidation, createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);

router.put('/:id', authorize('admin'), updateOrder);
router.get('/admin/all', authorize('admin'), getAllOrders);

module.exports = router;