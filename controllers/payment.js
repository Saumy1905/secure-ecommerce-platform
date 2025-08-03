const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { validationResult } = require('express-validator');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YourTestKeyId',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'YourTestKeySecret'
});

// @desc    Create order and get payment details
// @route   POST /api/payment/create-order
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    
    const { amount, currency, receipt, notes } = req.body;
    
    // Validate amount
    if (!amount || amount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }
    
    // Create order in Razorpay
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise (1 INR = 100 paise)
      currency: currency || 'INR',
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {}
    };
    
    const razorpayOrder = await razorpay.orders.create(options);
    
    res.status(200).json({
      success: true,
      data: razorpayOrder
    });
  } catch (err) {
    console.error('Razorpay order creation error:', err);
    res.status(500).json({
      success: false,
      message: 'Payment order creation failed'
    });
  }
};

// @desc    Verify payment signature
// @route   POST /api/payment/verify
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      orderId
    } = req.body;
    
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'YourTestKeySecret')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    
    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }
    
    if (orderId) {
      const order = await Order.findById(orderId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
      
      order.isPaid = true;
      order.paidAt = Date.now();
      order.orderStatus = 'confirmed';
      order.paymentResult = {
        id: razorpay_payment_id,
        status: 'completed',
        update_time: Date.now(),
        email_address: req.user.email
      };
      
      await order.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Payment verified successfully'
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
};

// @desc    Create a mock payment (for demonstration without actual payment gateway)
// @route   POST /api/payment/mock-payment
// @access  Private
exports.mockPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    order.isPaid = true;
    order.paidAt = Date.now();
    order.orderStatus = 'confirmed';
    order.paymentResult = {
      id: `mock_payment_${Date.now()}`,
      status: 'completed',
      update_time: Date.now(),
      email_address: req.user.email
    };
    
    await order.save();
    
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { $set: { items: [], totalPrice: 0 } },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    console.error('Mock payment error:', err);
    res.status(500).json({
      success: false,
      message: 'Payment processing failed'
    });
  }
};