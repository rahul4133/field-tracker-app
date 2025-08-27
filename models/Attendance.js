const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: () => new Date().setHours(0, 0, 0, 0) // Start of day
  },
  checkIn: {
    time: {
      type: Date,
      required: true
    },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: String
    },
    photo: String, // Optional selfie for verification
    notes: String
  },
  checkOut: {
    time: Date,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    photo: String,
    notes: String
  },
  breaks: [{
    breakStart: {
      time: Date,
      location: {
        latitude: Number,
        longitude: Number,
        address: String
      }
    },
    breakEnd: {
      time: Date,
      location: {
        latitude: Number,
        longitude: Number,
        address: String
      }
    },
    reason: String,
    duration: Number // in minutes
  }],
  totalHours: {
    type: Number,
    default: 0
  },
  totalBreakTime: {
    type: Number,
    default: 0 // in minutes
  },
  workingHours: {
    type: Number,
    default: 0 // totalHours - totalBreakTime
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'late', 'early-departure'],
    default: 'present'
  },
  isLate: {
    type: Boolean,
    default: false
  },
  lateBy: {
    type: Number, // minutes late
    default: 0
  },
  isEarlyDeparture: {
    type: Boolean,
    default: false
  },
  earlyBy: {
    type: Number, // minutes early
    default: 0
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvalNotes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for employee and date
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

// Calculate working hours before saving
attendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    const checkInTime = new Date(this.checkIn.time);
    const checkOutTime = new Date(this.checkOut.time);
    
    // Calculate total hours
    this.totalHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
    
    // Calculate total break time
    this.totalBreakTime = this.breaks.reduce((total, breakItem) => {
      if (breakItem.breakStart && breakItem.breakEnd) {
        const breakDuration = (new Date(breakItem.breakEnd.time) - new Date(breakItem.breakStart.time)) / (1000 * 60);
        return total + breakDuration;
      }
      return total;
    }, 0);
    
    // Calculate working hours (total - breaks)
    this.workingHours = this.totalHours - (this.totalBreakTime / 60);
    
    // Check if late (assuming 9:00 AM standard time)
    const standardCheckIn = new Date(checkInTime);
    standardCheckIn.setHours(9, 0, 0, 0);
    
    if (checkInTime > standardCheckIn) {
      this.isLate = true;
      this.lateBy = (checkInTime - standardCheckIn) / (1000 * 60);
      if (this.lateBy > 30) {
        this.status = 'late';
      }
    }
    
    // Check if early departure (assuming 6:00 PM standard time)
    const standardCheckOut = new Date(checkOutTime);
    standardCheckOut.setHours(18, 0, 0, 0);
    
    if (checkOutTime < standardCheckOut) {
      this.isEarlyDeparture = true;
      this.earlyBy = (standardCheckOut - checkOutTime) / (1000 * 60);
      if (this.earlyBy > 30) {
        this.status = 'early-departure';
      }
    }
    
    // Determine half-day
    if (this.workingHours < 4) {
      this.status = 'half-day';
    }
  }
  
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
