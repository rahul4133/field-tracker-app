const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  visit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  method: {
    type: String,
    enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  stripePaymentIntentId: String,
  receiptNumber: {
    type: String,
    unique: true
  },
  description: String,
  paymentDate: {
    type: Date,
    default: Date.now
  },
  dueDate: Date,
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  receiptImage: String, // URL to uploaded receipt image
  notes: String,
  refundDetails: {
    amount: Number,
    reason: String,
    date: Date,
    refundId: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate receipt number before saving
paymentSchema.pre('save', function(next) {
  if (!this.receiptNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.receiptNumber = `RCP${year}${month}${day}${random}`;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
