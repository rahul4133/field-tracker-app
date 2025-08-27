const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  leaveType: {
    type: String,
    enum: ['sick', 'casual', 'annual', 'maternity', 'paternity', 'emergency', 'unpaid'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  isHalfDay: {
    type: Boolean,
    default: false
  },
  halfDayType: {
    type: String,
    enum: ['first-half', 'second-half'],
    default: null
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  approvalHierarchy: [{
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    level: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    comments: String,
    actionDate: Date
  }],
  currentApprovalLevel: {
    type: Number,
    default: 1
  },
  finalApprover: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  finalApprovalDate: Date,
  finalComments: String,
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  handoverTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  handoverNotes: String,
  isUrgent: {
    type: Boolean,
    default: false
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate total days before saving
leaveSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    
    // Calculate days difference
    const timeDiff = end.getTime() - start.getTime();
    let daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    
    // Adjust for half day
    if (this.isHalfDay && daysDiff === 1) {
      daysDiff = 0.5;
    }
    
    this.totalDays = daysDiff;
  }
  
  this.updatedAt = new Date();
  next();
});

// Method to get next approver
leaveSchema.methods.getNextApprover = function() {
  const pendingApproval = this.approvalHierarchy.find(
    approval => approval.status === 'pending'
  );
  return pendingApproval ? pendingApproval.approver : null;
};

// Method to approve at current level
leaveSchema.methods.approveAtLevel = function(approverId, comments) {
  const currentApproval = this.approvalHierarchy.find(
    approval => approval.level === this.currentApprovalLevel
  );
  
  if (currentApproval && currentApproval.approver.toString() === approverId.toString()) {
    currentApproval.status = 'approved';
    currentApproval.comments = comments;
    currentApproval.actionDate = new Date();
    
    // Move to next level or complete
    const nextLevel = this.approvalHierarchy.find(
      approval => approval.level > this.currentApprovalLevel
    );
    
    if (nextLevel) {
      this.currentApprovalLevel = nextLevel.level;
    } else {
      // All approvals complete
      this.status = 'approved';
      this.finalApprover = approverId;
      this.finalApprovalDate = new Date();
      this.finalComments = comments;
    }
    
    return true;
  }
  
  return false;
};

// Method to reject leave
leaveSchema.methods.rejectLeave = function(approverId, comments) {
  const currentApproval = this.approvalHierarchy.find(
    approval => approval.level === this.currentApprovalLevel
  );
  
  if (currentApproval && currentApproval.approver.toString() === approverId.toString()) {
    currentApproval.status = 'rejected';
    currentApproval.comments = comments;
    currentApproval.actionDate = new Date();
    
    this.status = 'rejected';
    this.finalApprover = approverId;
    this.finalApprovalDate = new Date();
    this.finalComments = comments;
    
    return true;
  }
  
  return false;
};

module.exports = mongoose.model('Leave', leaveSchema);
