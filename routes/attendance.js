const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Attendance API is healthy',
    timestamp: new Date().toISOString()
  });
});

// Check-in endpoint
router.post('/checkin', auth, async (req, res) => {
  try {
    const { location, photo, notes } = req.body;
    const employeeId = req.user.userId;
    
    // Validate location data
    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({ 
        success: false, 
        message: 'Location data is required for check-in' 
      });
    }
    
    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
      employee: employeeId,
      date: today
    });
    
    if (existingAttendance && existingAttendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in today',
        checkInTime: existingAttendance.checkIn.time
      });
    }
    
    const checkInData = {
      time: new Date(),
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || ''
      },
      photo: photo || '',
      notes: notes || ''
    };
    
    let attendance;
    if (existingAttendance) {
      // Update existing record
      existingAttendance.checkIn = checkInData;
      attendance = await existingAttendance.save();
    } else {
      // Create new attendance record
      attendance = new Attendance({
        employee: employeeId,
        date: today,
        checkIn: checkInData
      });
      await attendance.save();
    }
    
    // Update user's current location and online status
    await User.findByIdAndUpdate(employeeId, {
      currentLocation: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || '',
        timestamp: new Date()
      },
      isOnline: true
    });
    
    res.json({
      success: true,
      message: 'Checked in successfully',
      attendance: {
        id: attendance._id,
        checkInTime: attendance.checkIn.time,
        location: attendance.checkIn.location
      }
    });
    
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check in',
      error: error.message
    });
  }
});

// Check-out endpoint
router.post('/checkout', auth, async (req, res) => {
  try {
    const { location, photo, notes } = req.body;
    const employeeId = req.user.userId;
    
    // Validate location data
    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({ 
        success: false, 
        message: 'Location data is required for check-out' 
      });
    }
    
    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find today's attendance record
    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: today
    });
    
    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'No check-in record found for today'
      });
    }
    
    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out today',
        checkOutTime: attendance.checkOut.time
      });
    }
    
    // Add check-out data
    attendance.checkOut = {
      time: new Date(),
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || ''
      },
      photo: photo || '',
      notes: notes || ''
    };
    
    await attendance.save();
    
    // Update user's online status
    await User.findByIdAndUpdate(employeeId, {
      isOnline: false,
      currentLocation: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || '',
        timestamp: new Date()
      }
    });
    
    res.json({
      success: true,
      message: 'Checked out successfully',
      attendance: {
        id: attendance._id,
        checkInTime: attendance.checkIn.time,
        checkOutTime: attendance.checkOut.time,
        totalHours: attendance.totalHours,
        workingHours: attendance.workingHours,
        status: attendance.status
      }
    });
    
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check out',
      error: error.message
    });
  }
});

// Start break endpoint
router.post('/break/start', auth, async (req, res) => {
  try {
    const { location, reason } = req.body;
    const employeeId = req.user.userId;
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find today's attendance record
    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: today
    });
    
    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'Please check in first'
      });
    }
    
    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start break after check-out'
      });
    }
    
    // Check if already on break
    const activeBreak = attendance.breaks.find(b => b.breakStart && !b.breakEnd);
    if (activeBreak) {
      return res.status(400).json({
        success: false,
        message: 'Already on break'
      });
    }
    
    // Add new break
    attendance.breaks.push({
      breakStart: {
        time: new Date(),
        location: {
          latitude: location?.latitude,
          longitude: location?.longitude,
          address: location?.address || ''
        }
      },
      reason: reason || 'Break'
    });
    
    await attendance.save();
    
    res.json({
      success: true,
      message: 'Break started successfully',
      breakId: attendance.breaks[attendance.breaks.length - 1]._id
    });
    
  } catch (error) {
    console.error('Start break error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start break',
      error: error.message
    });
  }
});

// End break endpoint
router.post('/break/end', auth, async (req, res) => {
  try {
    const { location } = req.body;
    const employeeId = req.user.userId;
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find today's attendance record
    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: today
    });
    
    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'No attendance record found'
      });
    }
    
    // Find active break
    const activeBreak = attendance.breaks.find(b => b.breakStart && !b.breakEnd);
    if (!activeBreak) {
      return res.status(400).json({
        success: false,
        message: 'No active break found'
      });
    }
    
    // End the break
    activeBreak.breakEnd = {
      time: new Date(),
      location: {
        latitude: location?.latitude,
        longitude: location?.longitude,
        address: location?.address || ''
      }
    };
    
    // Calculate break duration
    const breakDuration = (new Date(activeBreak.breakEnd.time) - new Date(activeBreak.breakStart.time)) / (1000 * 60);
    activeBreak.duration = breakDuration;
    
    await attendance.save();
    
    res.json({
      success: true,
      message: 'Break ended successfully',
      breakDuration: Math.round(breakDuration)
    });
    
  } catch (error) {
    console.error('End break error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end break',
      error: error.message
    });
  }
});

// Get today's attendance status
router.get('/today', auth, async (req, res) => {
  try {
    const employeeId = req.user.userId;
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: today
    }).populate('employee', 'name employeeId');
    
    if (!attendance) {
      return res.json({
        success: true,
        attendance: null,
        status: 'not-checked-in'
      });
    }
    
    // Check if on break
    const activeBreak = attendance.breaks.find(b => b.breakStart && !b.breakEnd);
    
    let status = 'not-checked-in';
    if (attendance.checkIn && !attendance.checkOut) {
      status = activeBreak ? 'on-break' : 'checked-in';
    } else if (attendance.checkOut) {
      status = 'checked-out';
    }
    
    res.json({
      success: true,
      attendance,
      status,
      activeBreak: activeBreak || null
    });
    
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance status',
      error: error.message
    });
  }
});

// Get attendance history
router.get('/history', auth, async (req, res) => {
  try {
    const employeeId = req.user.userId;
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    
    let query = { employee: employeeId };
    
    // Add date filter if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    
    const [attendance, total] = await Promise.all([
      Attendance.find(query)
        .populate('employee', 'name employeeId')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Attendance.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      attendance,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
    
  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance history',
      error: error.message
    });
  }
});

// Get team attendance (for managers/admins)
router.get('/team', auth, async (req, res) => {
  try {
    const { role } = req.user;
    const { date, status } = req.query;
    
    if (role === 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Get target date (default to today)
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    
    let query = { date: targetDate };
    if (status) query.status = status;
    
    const attendance = await Attendance.find(query)
      .populate('employee', 'name employeeId department')
      .sort({ 'checkIn.time': 1 });
    
    // Get all employees to show who didn't check in
    const allEmployees = await User.find({ 
      role: 'employee', 
      isActive: true 
    }).select('name employeeId department');
    
    const checkedInEmployees = attendance.map(a => a.employee._id.toString());
    const absentEmployees = allEmployees.filter(emp => 
      !checkedInEmployees.includes(emp._id.toString())
    );
    
    res.json({
      success: true,
      date: targetDate,
      attendance,
      absentEmployees,
      summary: {
        present: attendance.length,
        absent: absentEmployees.length,
        late: attendance.filter(a => a.isLate).length,
        onTime: attendance.filter(a => !a.isLate).length
      }
    });
    
  } catch (error) {
    console.error('Get team attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get team attendance',
      error: error.message
    });
  }
});

// Approve/reject attendance (for managers/admins)
router.put('/:attendanceId/approve', auth, async (req, res) => {
  try {
    const { role, userId } = req.user;
    const { attendanceId } = req.params;
    const { status, notes } = req.body; // status: 'approved' or 'rejected'
    
    if (role === 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const attendance = await Attendance.findById(attendanceId)
      .populate('employee', 'name employeeId');
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }
    
    attendance.approvalStatus = status;
    attendance.approvedBy = userId;
    attendance.approvalNotes = notes || '';
    
    await attendance.save();
    
    res.json({
      success: true,
      message: `Attendance ${status} successfully`,
      attendance
    });
    
  } catch (error) {
    console.error('Approve attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance approval',
      error: error.message
    });
  }
});

module.exports = router;
