const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/leave-attachments/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

// Apply for leave
router.post('/apply', auth, upload.array('attachments', 5), async (req, res) => {
  try {
    const {
      leaveType,
      startDate,
      endDate,
      reason,
      isHalfDay,
      halfDayType,
      emergencyContact,
      handoverTo,
      isUrgent
    } = req.body;
    
    const employeeId = req.user.userId;
    
    // Validate required fields
    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Leave type, dates, and reason are required'
      });
    }
    
    // Get employee details
    const employee = await User.findById(employeeId).populate('manager');
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Setup approval hierarchy
    const approvalHierarchy = [];
    
    // Level 1: Direct Manager (if exists)
    if (employee.manager) {
      approvalHierarchy.push({
        approver: employee.manager._id,
        level: 1,
        status: 'pending'
      });
    }
    
    // Level 2: Admin (for leaves > 3 days or urgent leaves)
    const totalDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
    if (totalDays > 3 || isUrgent === 'true' || leaveType === 'maternity' || leaveType === 'paternity') {
      const admin = await User.findOne({ role: 'admin', isActive: true });
      if (admin) {
        approvalHierarchy.push({
          approver: admin._id,
          level: employee.manager ? 2 : 1,
          status: 'pending'
        });
      }
    }
    
    // If no approval hierarchy, auto-approve (for admins)
    if (approvalHierarchy.length === 0) {
      approvalHierarchy.push({
        approver: employeeId,
        level: 1,
        status: 'approved'
      });
    }
    
    // Handle file attachments
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        attachments.push({
          filename: file.originalname,
          url: file.path,
          uploadedAt: new Date()
        });
      });
    }
    
    // Parse emergency contact if provided
    let parsedEmergencyContact = null;
    if (emergencyContact) {
      try {
        parsedEmergencyContact = typeof emergencyContact === 'string' 
          ? JSON.parse(emergencyContact) 
          : emergencyContact;
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    // Create leave application
    const leave = new Leave({
      employee: employeeId,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      isHalfDay: isHalfDay === 'true',
      halfDayType: halfDayType || null,
      attachments,
      approvalHierarchy,
      currentApprovalLevel: 1,
      emergencyContact: parsedEmergencyContact,
      handoverTo: handoverTo || null,
      isUrgent: isUrgent === 'true',
      status: approvalHierarchy[0].status === 'approved' ? 'approved' : 'pending'
    });
    
    await leave.save();
    
    // Populate the created leave for response
    const populatedLeave = await Leave.findById(leave._id)
      .populate('employee', 'name employeeId email')
      .populate('approvalHierarchy.approver', 'name email role')
      .populate('handoverTo', 'name employeeId');
    
    res.json({
      success: true,
      message: 'Leave application submitted successfully',
      leave: populatedLeave
    });
    
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit leave application',
      error: error.message
    });
  }
});

// Get my leave applications
router.get('/my-leaves', auth, async (req, res) => {
  try {
    const employeeId = req.user.userId;
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = { employee: employeeId };
    if (status) query.status = status;
    
    const skip = (page - 1) * limit;
    
    const [leaves, total] = await Promise.all([
      Leave.find(query)
        .populate('approvalHierarchy.approver', 'name email role')
        .populate('handoverTo', 'name employeeId')
        .sort({ appliedDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Leave.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      leaves,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
    
  } catch (error) {
    console.error('Get my leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leave applications',
      error: error.message
    });
  }
});

// Get pending approvals (for managers/admins)
router.get('/pending-approvals', auth, async (req, res) => {
  try {
    const { userId, role } = req.user;
    
    if (role === 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Find leaves where current user is the next approver
    const leaves = await Leave.find({
      status: 'pending',
      'approvalHierarchy.approver': userId,
      'approvalHierarchy.status': 'pending'
    })
    .populate('employee', 'name employeeId email department')
    .populate('approvalHierarchy.approver', 'name email role')
    .populate('handoverTo', 'name employeeId')
    .sort({ appliedDate: 1 });
    
    // Filter to only show leaves where this user is the current approver
    const pendingForUser = leaves.filter(leave => {
      const currentApproval = leave.approvalHierarchy.find(
        approval => approval.level === leave.currentApprovalLevel
      );
      return currentApproval && currentApproval.approver._id.toString() === userId;
    });
    
    res.json({
      success: true,
      leaves: pendingForUser
    });
    
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending approvals',
      error: error.message
    });
  }
});

// Approve/reject leave
router.put('/:leaveId/action', auth, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { leaveId } = req.params;
    const { action, comments } = req.body; // action: 'approve' or 'reject'
    
    if (role === 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const leave = await Leave.findById(leaveId)
      .populate('employee', 'name employeeId email')
      .populate('approvalHierarchy.approver', 'name email role');
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }
    
    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Leave application is not pending'
      });
    }
    
    let success = false;
    if (action === 'approve') {
      success = leave.approveAtLevel(userId, comments);
    } else if (action === 'reject') {
      success = leave.rejectLeave(userId, comments);
    }
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'You are not authorized to take action on this leave application'
      });
    }
    
    await leave.save();
    
    // Populate updated leave for response
    const updatedLeave = await Leave.findById(leaveId)
      .populate('employee', 'name employeeId email')
      .populate('approvalHierarchy.approver', 'name email role')
      .populate('finalApprover', 'name email role');
    
    res.json({
      success: true,
      message: `Leave application ${action}d successfully`,
      leave: updatedLeave
    });
    
  } catch (error) {
    console.error('Leave action error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process leave action',
      error: error.message
    });
  }
});

// Cancel leave application
router.put('/:leaveId/cancel', auth, async (req, res) => {
  try {
    const employeeId = req.user.userId;
    const { leaveId } = req.params;
    const { reason } = req.body;
    
    const leave = await Leave.findOne({
      _id: leaveId,
      employee: employeeId
    });
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }
    
    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending leave applications can be cancelled'
      });
    }
    
    // Check if leave start date is not too close
    const today = new Date();
    const startDate = new Date(leave.startDate);
    const daysDiff = (startDate - today) / (1000 * 60 * 60 * 24);
    
    if (daysDiff < 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel leave application on the same day or after start date'
      });
    }
    
    leave.status = 'cancelled';
    leave.finalComments = reason || 'Cancelled by employee';
    leave.finalApprovalDate = new Date();
    
    await leave.save();
    
    res.json({
      success: true,
      message: 'Leave application cancelled successfully',
      leave
    });
    
  } catch (error) {
    console.error('Cancel leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel leave application',
      error: error.message
    });
  }
});

// Get leave balance (basic implementation)
router.get('/balance', auth, async (req, res) => {
  try {
    const employeeId = req.user.userId;
    const currentYear = new Date().getFullYear();
    
    // Get approved leaves for current year
    const approvedLeaves = await Leave.find({
      employee: employeeId,
      status: 'approved',
      startDate: {
        $gte: new Date(currentYear, 0, 1),
        $lte: new Date(currentYear, 11, 31)
      }
    });
    
    // Calculate used days by leave type
    const usedDays = {
      casual: 0,
      sick: 0,
      annual: 0,
      maternity: 0,
      paternity: 0,
      emergency: 0,
      unpaid: 0
    };
    
    approvedLeaves.forEach(leave => {
      usedDays[leave.leaveType] += leave.totalDays;
    });
    
    // Define annual leave entitlements (can be made configurable)
    const entitlements = {
      casual: 12,
      sick: 12,
      annual: 21,
      maternity: 180,
      paternity: 15,
      emergency: 5,
      unpaid: 365 // No limit for unpaid
    };
    
    // Calculate remaining balance
    const balance = {};
    Object.keys(entitlements).forEach(type => {
      balance[type] = {
        entitled: entitlements[type],
        used: usedDays[type],
        remaining: Math.max(0, entitlements[type] - usedDays[type])
      };
    });
    
    res.json({
      success: true,
      year: currentYear,
      balance
    });
    
  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leave balance',
      error: error.message
    });
  }
});

// Get team leave calendar (for managers/admins)
router.get('/team-calendar', auth, async (req, res) => {
  try {
    const { role } = req.user;
    const { month, year } = req.query;
    
    if (role === 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    
    // Get start and end of month
    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0);
    
    // Find approved leaves that overlap with the target month
    const leaves = await Leave.find({
      status: 'approved',
      $or: [
        {
          startDate: { $gte: startOfMonth, $lte: endOfMonth }
        },
        {
          endDate: { $gte: startOfMonth, $lte: endOfMonth }
        },
        {
          startDate: { $lte: startOfMonth },
          endDate: { $gte: endOfMonth }
        }
      ]
    })
    .populate('employee', 'name employeeId department')
    .sort({ startDate: 1 });
    
    res.json({
      success: true,
      month: targetMonth + 1,
      year: targetYear,
      leaves
    });
    
  } catch (error) {
    console.error('Get team calendar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get team leave calendar',
      error: error.message
    });
  }
});

module.exports = router;
