const express = require('express');
const { check } = require('express-validator');
const { 
  getCart, 
  addToCart, 
  updateCartItem,
  removeCartItem,
  clearCart
} = require('../controllers/cart');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Cart item validation
const cartItemValidation = [
  check('productId', 'Product ID is required').not().isEmpty(),
  check('quantity', 'Quantity must be a positive number').isInt({ min: 1 })
];

router.use(protect);

// @route   GET api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', getCart);

// @route   POST api/cart
// @desc    Add item to cart
// @access  Private
router.post('/', cartItemValidation, addToCart);

// @route   PUT api/cart/:productId
// @desc    Update cart item quantity
// @access  Private
router.put('/:productId', [
  check('quantity', 'Quantity must be a positive number').isInt({ min: 1 })
], updateCartItem);

// @route   DELETE api/cart/:productId
// @desc    Remove item from cart
// @access  Private
router.delete('/:productId', removeCartItem);

// @route   DELETE api/cart
// @desc    Clear entire cart
// @access  Private
router.delete('/', clearCart);

module.exports = router;
