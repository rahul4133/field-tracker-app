const express = require('express');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all employees
router.get('/', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { role: { $in: ['employee', 'manager'] } };
    
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { employeeId: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    const employees = await User.find(query)
      .select('-password')
      .populate('manager', 'name employeeId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      employees,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Server error fetching employees' });
  }
});

// Get single employee
router.get('/:id', auth, async (req, res) => {
  try {
    const employee = await User.findById(req.params.id)
      .select('-password')
      .populate('manager', 'name employeeId');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Only allow access to own profile for employees
    if (req.user.role === 'employee' && req.user.userId !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ employee });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ message: 'Server error fetching employee' });
  }
});

// Update employee
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, phone, department, manager, isActive } = req.body;
    
    // Employees can only update their own basic info
    if (req.user.role === 'employee' && req.user.userId !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only admins can change role and active status
    const updateData = { name, phone, department };
    if (req.user.role === 'admin') {
      if (manager) updateData.manager = manager;
      if (isActive !== undefined) updateData.isActive = isActive;
    }

    const employee = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .select('-password')
    .populate('manager', 'name employeeId');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({
      message: 'Employee updated successfully',
      employee
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: 'Server error updating employee' });
  }
});

// Get employee's current location
router.get('/:id/location', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    const employee = await User.findById(req.params.id)
      .select('name employeeId currentLocation isOnline');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({
      employee: {
        id: employee._id,
        name: employee.name,
        employeeId: employee.employeeId,
        currentLocation: employee.currentLocation,
        isOnline: employee.isOnline
      }
    });
  } catch (error) {
    console.error('Get employee location error:', error);
    res.status(500).json({ message: 'Server error fetching employee location' });
  }
});

// Get all employees' locations for live tracking
router.get('/locations/live', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    const employees = await User.find({
      role: 'employee',
      isActive: true,
      isOnline: true,
      'currentLocation.latitude': { $exists: true }
    })
    .select('name employeeId currentLocation isOnline')
    .sort({ name: 1 });

    const locations = employees.map(emp => ({
      id: emp._id,
      name: emp.name,
      employeeId: emp.employeeId,
      location: emp.currentLocation,
      isOnline: emp.isOnline
    }));

    res.json({ locations });
  } catch (error) {
    console.error('Get live locations error:', error);
    res.status(500).json({ message: 'Server error fetching live locations' });
  }
});

// Deactivate employee
router.put('/:id/deactivate', auth, authorize('admin'), async (req, res) => {
  try {
    const employee = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false, isOnline: false },
      { new: true }
    ).select('-password');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({
      message: 'Employee deactivated successfully',
      employee
    });
  } catch (error) {
    console.error('Deactivate employee error:', error);
    res.status(500).json({ message: 'Server error deactivating employee' });
  }
});

module.exports = router;
