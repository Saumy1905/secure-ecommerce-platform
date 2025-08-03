const express = require('express');
const { check } = require('express-validator');
const { 
  createOrder, 
  verifyPayment,
  mockPayment
} = require('../controllers/payment');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

const paymentValidation = [
  check('amount', 'Amount is required and must be a positive number').isFloat({ min: 0.01 })
];

router.post('/create-order', paymentValidation, createOrder);
router.post('/verify', verifyPayment);
router.post('/mock-payment', mockPayment);

module.exports = router;