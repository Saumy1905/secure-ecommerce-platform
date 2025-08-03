const express = require('express');
const { check } = require('express-validator');
const { 
  getProducts, 
  getProduct, 
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/product');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const productValidation = [
  check('name', 'Name is required').not().isEmpty(),
  check('description', 'Description is required').not().isEmpty(),
  check('price', 'Price must be a positive number').isFloat({ min: 0 }),
  check('category', 'Category is required').not().isEmpty()
];

router.get('/', getProducts);
router.get('/:id', getProduct);

router.post(
  '/', 
  [protect, authorize('admin'), productValidation], 
  createProduct
);

router.put(
  '/:id', 
  [protect, authorize('admin'), productValidation], 
  updateProduct
);

router.delete(
  '/:id', 
  [protect, authorize('admin')], 
  deleteProduct
);

module.exports = router;