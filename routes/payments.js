const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Visit = require('../models/Visit');
const { auth, authorize } = require('../middleware/auth');

// Initialize Cashfree
const cashfreeConfig = {
  appId: process.env.CASHFREE_APP_ID,
  secretKey: process.env.CASHFREE_SECRET_KEY,
  baseURL: process.env.CASHFREE_BASE_URL || 'https://api.cashfree.com/pg',
  version: '2023-08-01'
};

// Get all payments with filtering
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    
    // Filter by employee
    if (req.user.role === 'employee') {
      query.employee = req.user.userId;
    } else if (req.query.employeeId) {
      query.employee = req.query.employeeId;
    }

    // Date filters
    if (req.query.startDate && req.query.endDate) {
      query.paymentDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    // Status filter
    if (req.query.status) query.status = req.query.status;

    const payments = await Payment.find(query)
      .populate('customer', 'name phone')
      .populate('employee', 'name employeeId')
      .populate('visit', 'checkInTime purpose')
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(query);

    res.json({
      payments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error fetching payments' });
  }
});

// Create cash payment
router.post('/cash', auth, async (req, res) => {
  try {
    const { customerId, visitId, amount, description, latitude, longitude, address } = req.body;

    // Verify customer is assigned to employee
    const customer = await Customer.findOne({
      _id: customerId,
      assignedEmployee: req.user.userId
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found or not assigned to you' });
    }

    const payment = new Payment({
      customer: customerId,
      employee: req.user.userId,
      visit: visitId,
      amount,
      method: 'cash',
      status: 'completed',
      description,
      location: {
        latitude,
        longitude,
        address
      }
    });

    await payment.save();

    // Update customer's outstanding amount
    customer.outstandingAmount = Math.max(0, customer.outstandingAmount - amount);
    await customer.save();

    // Update visit payment info if visit exists
    if (visitId) {
      await Visit.findByIdAndUpdate(visitId, {
        paymentCollected: {
          amount,
          method: 'cash',
          status: 'completed'
        }
      });
    }

    await payment.populate(['customer', 'employee', 'visit']);

    res.status(201).json({
      message: 'Cash payment recorded successfully',
      payment
    });
  } catch (error) {
    console.error('Cash payment error:', error);
    res.status(500).json({ message: 'Server error recording payment' });
  }
});

// Create Cashfree order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { amount, customerId, visitId } = req.body;

    const orderData = {
      order_id: `order_${Date.now()}`,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: customerId,
        customer_phone: '9999999999', // Will be updated with actual customer phone
        customer_email: 'customer@example.com'
      },
      order_meta: {
        return_url: `${process.env.CLIENT_URL}/payment/callback`,
        notify_url: `${process.env.SERVER_URL}/api/payments/webhook`,
        payment_methods: 'cc,dc,upi,nb,wallet'
      },
      order_note: `Payment for visit ${visitId}`,
      order_tags: {
        customerId,
        visitId,
        employeeId: req.user.userId
      }
    };

    const response = await axios.post(
      `${cashfreeConfig.baseURL}/orders`,
      orderData,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-version': cashfreeConfig.version,
          'x-client-id': cashfreeConfig.appId,
          'x-client-secret': cashfreeConfig.secretKey
        }
      }
    );
    
    res.json({
      success: true,
      orderId: response.data.order_id,
      amount: response.data.order_amount,
      currency: response.data.order_currency,
      paymentSessionId: response.data.payment_session_id,
      appId: cashfreeConfig.appId
    });
  } catch (error) {
    console.error('Cashfree order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.response?.data || error.message
    });
  }
});

// Verify Cashfree payment
router.post('/verify-payment', auth, async (req, res) => {
  try {
    const { 
      orderId,
      customerId,
      visitId,
      amount 
    } = req.body;

    // Get payment details from Cashfree
    const response = await axios.get(
      `${cashfreeConfig.baseURL}/orders/${orderId}/payments`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-version': cashfreeConfig.version,
          'x-client-id': cashfreeConfig.appId,
          'x-client-secret': cashfreeConfig.secretKey
        }
      }
    );

    const paymentData = response.data[0]; // Get first payment
    
    if (paymentData && paymentData.payment_status === 'SUCCESS') {
      // Payment verified - create payment record
      const payment = new Payment({
        customer: customerId,
        employee: req.user.userId,
        visit: visitId,
        amount: paymentData.payment_amount,
        method: paymentData.payment_method || 'card',
        status: 'completed',
        transactionId: paymentData.cf_payment_id,
        paymentGateway: 'cashfree',
        gatewayResponse: {
          order_id: orderId,
          payment_id: paymentData.cf_payment_id,
          payment_status: paymentData.payment_status,
          payment_method: paymentData.payment_method
        },
        receiptNumber: `RCP-${Date.now()}`,
        receiptGenerated: true
      });

      await payment.save();

      // Update visit with payment info
      if (visitId) {
        await Visit.findByIdAndUpdate(visitId, {
          paymentCollected: true,
          paymentAmount: paymentData.payment_amount,
          paymentMethod: paymentData.payment_method || 'card'
        });
      }

      res.json({
        success: true,
        message: 'Payment verified successfully',
        payment
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment verification failed or payment not successful'
      });
    }
  } catch (error) {
    console.error('Cashfree payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.response?.data || error.message
    });
  }
});

// Create payment intent for card payments
router.post('/create-intent', auth, async (req, res) => {
  try {
    const { customerId, amount, description } = req.body;

    // Verify customer
    const customer = await Customer.findOne({
      _id: customerId,
      assignedEmployee: req.user.userId
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found or not assigned to you' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'inr',
      metadata: {
        customerId: customerId.toString(),
        employeeId: req.user.userId.toString(),
        description: description || 'Payment collection'
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ message: 'Server error creating payment intent' });
  }
});

// Confirm card payment
router.post('/confirm-card', auth, async (req, res) => {
  try {
    const { paymentIntentId, customerId, visitId, latitude, longitude, address } = req.body;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not successful' });
    }

    const amount = paymentIntent.amount / 100; // Convert from cents

    const payment = new Payment({
      customer: customerId,
      employee: req.user.userId,
      visit: visitId,
      amount,
      method: 'card',
      status: 'completed',
      stripePaymentIntentId: paymentIntentId,
      transactionId: paymentIntent.id,
      description: paymentIntent.metadata.description,
      location: {
        latitude,
        longitude,
        address
      }
    });

    await payment.save();

    // Update customer's outstanding amount
    const customer = await Customer.findById(customerId);
    if (customer) {
      customer.outstandingAmount = Math.max(0, customer.outstandingAmount - amount);
      await customer.save();
    }

    // Update visit payment info if visit exists
    if (visitId) {
      await Visit.findByIdAndUpdate(visitId, {
        paymentCollected: {
          amount,
          method: 'card',
          transactionId: paymentIntent.id,
          status: 'completed'
        }
      });
    }

    await payment.populate(['customer', 'employee', 'visit']);

    res.json({
      message: 'Card payment confirmed successfully',
      payment
    });
  } catch (error) {
    console.error('Card payment confirmation error:', error);
    res.status(500).json({ message: 'Server error confirming payment' });
  }
});

// Record UPI payment
router.post('/upi', auth, async (req, res) => {
  try {
    const { customerId, visitId, amount, transactionId, description, latitude, longitude, address } = req.body;

    // Verify customer
    const customer = await Customer.findOne({
      _id: customerId,
      assignedEmployee: req.user.userId
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found or not assigned to you' });
    }

    const payment = new Payment({
      customer: customerId,
      employee: req.user.userId,
      visit: visitId,
      amount,
      method: 'upi',
      status: 'completed',
      transactionId,
      description,
      location: {
        latitude,
        longitude,
        address
      }
    });

    await payment.save();

    // Update customer's outstanding amount
    customer.outstandingAmount = Math.max(0, customer.outstandingAmount - amount);
    await customer.save();

    // Update visit payment info
    if (visitId) {
      await Visit.findByIdAndUpdate(visitId, {
        paymentCollected: {
          amount,
          method: 'upi',
          transactionId,
          status: 'completed'
        }
      });
    }

    await payment.populate(['customer', 'employee', 'visit']);

    res.status(201).json({
      message: 'UPI payment recorded successfully',
      payment
    });
  } catch (error) {
    console.error('UPI payment error:', error);
    res.status(500).json({ message: 'Server error recording UPI payment' });
  }
});

// Get payment receipt
router.get('/:id/receipt', auth, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    if (req.user.role === 'employee') {
      query.employee = req.user.userId;
    }

    const payment = await Payment.findOne(query)
      .populate('customer', 'name phone address')
      .populate('employee', 'name employeeId')
      .populate('visit', 'checkInTime purpose');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({ message: 'Server error fetching receipt' });
  }
});

// Get payment statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    
    let matchQuery = {};
    
    if (req.user.role === 'employee') {
      matchQuery.employee = req.user.userId;
    } else if (employeeId) {
      matchQuery.employee = employeeId;
    }

    if (startDate && endDate) {
      matchQuery.paymentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stats = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalPayments: { $sum: 1 },
          cashPayments: {
            $sum: { $cond: [{ $eq: ['$method', 'cash'] }, '$amount', 0] }
          },
          cardPayments: {
            $sum: { $cond: [{ $eq: ['$method', 'card'] }, '$amount', 0] }
          },
          upiPayments: {
            $sum: { $cond: [{ $eq: ['$method', 'upi'] }, '$amount', 0] }
          },
          completedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalAmount: 0,
      totalPayments: 0,
      cashPayments: 0,
      cardPayments: 0,
      upiPayments: 0,
      completedPayments: 0
    };

    res.json({ stats: result });
  } catch (error) {
    console.error('Payment stats error:', error);
    res.status(500).json({ message: 'Server error fetching payment statistics' });
  }
});

module.exports = router;
