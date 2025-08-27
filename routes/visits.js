const express = require('express');
const Visit = require('../models/Visit');
const Customer = require('../models/Customer');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all visits with filtering and pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    
    // Filter by employee (employees can only see their visits)
    if (req.user.role === 'employee') {
      query.employee = req.user.userId;
    } else if (req.query.employeeId) {
      query.employee = req.query.employeeId;
    }

    // Date filters
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    // Status filter
    if (req.query.status) query.status = req.query.status;

    const visits = await Visit.find(query)
      .populate('employee', 'name employeeId')
      .populate('customer', 'name phone address')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Visit.countDocuments(query);

    res.json({
      visits,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get visits error:', error);
    res.status(500).json({ message: 'Server error fetching visits' });
  }
});

// Get single visit
router.get('/:id', auth, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    if (req.user.role === 'employee') {
      query.employee = req.user.userId;
    }

    const visit = await Visit.findOne(query)
      .populate('employee', 'name employeeId')
      .populate('customer', 'name phone address');

    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    res.json({ visit });
  } catch (error) {
    console.error('Get visit error:', error);
    res.status(500).json({ message: 'Server error fetching visit' });
  }
});

// Create new visit (check-in)
router.post('/checkin', auth, async (req, res) => {
  try {
    const { customerId, purpose, latitude, longitude, address, notes } = req.body;

    // Verify customer is assigned to employee
    const customer = await Customer.findOne({
      _id: customerId,
      assignedEmployee: req.user.userId
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found or not assigned to you' });
    }

    const visit = new Visit({
      employee: req.user.userId,
      customer: customerId,
      checkInTime: new Date(),
      checkInLocation: {
        latitude,
        longitude,
        address
      },
      purpose,
      status: 'in_progress',
      notes
    });

    await visit.save();
    await visit.populate(['employee', 'customer']);

    // Update customer's last visit
    customer.lastVisit = new Date();
    await customer.save();

    res.status(201).json({
      message: 'Check-in successful',
      visit
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Server error during check-in' });
  }
});

// Update visit (check-out)
router.put('/:id/checkout', auth, async (req, res) => {
  try {
    const { latitude, longitude, address, notes, paymentCollected, photos, feedback } = req.body;

    const visit = await Visit.findOne({
      _id: req.params.id,
      employee: req.user.userId,
      status: 'in_progress'
    });

    if (!visit) {
      return res.status(404).json({ message: 'Active visit not found' });
    }

    visit.checkOutTime = new Date();
    visit.checkOutLocation = {
      latitude,
      longitude,
      address
    };
    visit.status = 'completed';
    
    if (notes) visit.notes = notes;
    if (paymentCollected) visit.paymentCollected = paymentCollected;
    if (photos) visit.photos = photos;
    if (feedback) visit.feedback = feedback;

    await visit.save();
    await visit.populate(['employee', 'customer']);

    res.json({
      message: 'Check-out successful',
      visit
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Server error during check-out' });
  }
});

// Update visit route (for live tracking)
router.put('/:id/route', auth, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    const visit = await Visit.findOne({
      _id: req.params.id,
      employee: req.user.userId,
      status: 'in_progress'
    });

    if (!visit) {
      return res.status(404).json({ message: 'Active visit not found' });
    }

    visit.route.push({
      latitude,
      longitude,
      timestamp: new Date()
    });

    await visit.save();

    res.json({ message: 'Route updated successfully' });
  } catch (error) {
    console.error('Route update error:', error);
    res.status(500).json({ message: 'Server error updating route' });
  }
});

// Get employee's daily route
router.get('/employee/:employeeId/route', auth, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const date = req.query.date ? new Date(req.query.date) : new Date();
    
    // Set date range for the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Check authorization
    if (req.user.role === 'employee' && req.user.userId !== employeeId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const visits = await Visit.find({
      employee: employeeId,
      date: { $gte: startOfDay, $lte: endOfDay }
    })
    .populate('customer', 'name address')
    .sort({ checkInTime: 1 });

    const routeData = visits.map(visit => ({
      visitId: visit._id,
      customer: visit.customer,
      checkInTime: visit.checkInTime,
      checkOutTime: visit.checkOutTime,
      checkInLocation: visit.checkInLocation,
      checkOutLocation: visit.checkOutLocation,
      route: visit.route,
      status: visit.status,
      duration: visit.duration
    }));

    res.json({ routeData, date: date.toISOString().split('T')[0] });
  } catch (error) {
    console.error('Get route error:', error);
    res.status(500).json({ message: 'Server error fetching route' });
  }
});

// Schedule visit
router.post('/schedule', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { employeeId, customerId, scheduledDate, purpose, notes } = req.body;

    const visit = new Visit({
      employee: employeeId,
      customer: customerId,
      date: new Date(scheduledDate),
      purpose,
      status: 'scheduled',
      notes
    });

    await visit.save();
    await visit.populate(['employee', 'customer']);

    res.status(201).json({
      message: 'Visit scheduled successfully',
      visit
    });
  } catch (error) {
    console.error('Schedule visit error:', error);
    res.status(500).json({ message: 'Server error scheduling visit' });
  }
});

module.exports = router;
