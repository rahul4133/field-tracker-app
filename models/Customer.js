const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  customerType: {
    type: String,
    enum: ['individual', 'business'],
    default: 'individual'
  },
  businessName: String,
  assignedEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  paymentHistory: [{
    amount: Number,
    date: Date,
    method: String,
    transactionId: String,
    status: String
  }],
  outstandingAmount: {
    type: Number,
    default: 0
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastVisit: {
    type: Date
  },
  visitFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly'],
    default: 'weekly'
  }
});

module.exports = mongoose.model('Customer', customerSchema);
