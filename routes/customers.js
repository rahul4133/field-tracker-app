const express = require('express');
const csv = require('csv-parser');
const multer = require('multer');
const fs = require('fs');
const Customer = require('../models/Customer');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Configure multer for CSV upload
const upload = multer({ dest: 'uploads/' });

// Get all customers (with pagination and filtering)
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    
    // Filter by assigned employee (employees can only see their customers)
    if (req.user.role === 'employee') {
      query.assignedEmployee = req.user.userId;
    } else if (req.query.employeeId) {
      query.assignedEmployee = req.query.employeeId;
    }

    // Additional filters
    if (req.query.status) query.status = req.query.status;
    if (req.query.customerType) query.customerType = req.query.customerType;
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query)
      .populate('assignedEmployee', 'name email employeeId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Customer.countDocuments(query);

    res.json({
      customers,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'Server error fetching customers' });
  }
});

// Get single customer
router.get('/:id', auth, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // Employees can only access their assigned customers
    if (req.user.role === 'employee') {
      query.assignedEmployee = req.user.userId;
    }

    const customer = await Customer.findOne(query)
      .populate('assignedEmployee', 'name email employeeId');

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({ customer });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ message: 'Server error fetching customer' });
  }
});

// Create new customer
router.post('/', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    const customerData = req.body;
    const customer = new Customer(customerData);
    await customer.save();

    await customer.populate('assignedEmployee', 'name email employeeId');

    res.status(201).json({
      message: 'Customer created successfully',
      customer
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ message: 'Server error creating customer' });
  }
});

// Update customer
router.put('/:id', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedEmployee', 'name email employeeId');

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({
      message: 'Customer updated successfully',
      customer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ message: 'Server error updating customer' });
  }
});

// Delete customer
router.delete('/:id', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ message: 'Server error deleting customer' });
  }
});

// Bulk import customers from CSV
router.post('/import', auth, authorize('admin', 'manager'), upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    const results = [];
    const errors = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          const customers = [];

          for (let i = 0; i < results.length; i++) {
            const row = results[i];
            try {
              const customer = new Customer({
                name: row.name,
                email: row.email,
                phone: row.phone,
                address: {
                  street: row.street,
                  city: row.city,
                  state: row.state,
                  zipCode: row.zipCode,
                  country: row.country
                },
                customerType: row.customerType || 'individual',
                businessName: row.businessName,
                assignedEmployee: row.assignedEmployee,
                outstandingAmount: parseFloat(row.outstandingAmount) || 0,
                creditLimit: parseFloat(row.creditLimit) || 0,
                visitFrequency: row.visitFrequency || 'weekly'
              });

              await customer.validate();
              customers.push(customer);
            } catch (error) {
              errors.push({
                row: i + 1,
                data: row,
                error: error.message
              });
            }
          }

          // Save valid customers
          if (customers.length > 0) {
            await Customer.insertMany(customers);
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          res.json({
            message: 'Import completed',
            imported: customers.length,
            errors: errors.length,
            errorDetails: errors
          });
        } catch (error) {
          console.error('CSV processing error:', error);
          fs.unlinkSync(req.file.path);
          res.status(500).json({ message: 'Error processing CSV file' });
        }
      });
  } catch (error) {
    console.error('Import error:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Server error during import' });
  }
});

module.exports = router;
