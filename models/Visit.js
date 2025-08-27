const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  checkInTime: {
    type: Date,
    required: true
  },
  checkOutTime: {
    type: Date
  },
  checkInLocation: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    address: String
  },
  checkOutLocation: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  purpose: {
    type: String,
    enum: ['payment_collection', 'delivery', 'meeting', 'support', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  notes: String,
  photos: [String], // URLs to uploaded photos
  paymentCollected: {
    amount: Number,
    method: String,
    transactionId: String,
    status: String
  },
  duration: Number, // in minutes
  distanceTraveled: Number, // in kilometers
  route: [{
    latitude: Number,
    longitude: Number,
    timestamp: Date
  }],
  feedback: {
    customerSatisfaction: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String
  }
});

// Calculate duration before saving
visitSchema.pre('save', function(next) {
  if (this.checkInTime && this.checkOutTime) {
    this.duration = Math.round((this.checkOutTime - this.checkInTime) / (1000 * 60));
  }
  next();
});

module.exports = mongoose.model('Visit', visitSchema);
