const express = require('express');
const Visit = require('../models/Visit');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Employee performance report
router.get('/employee-performance', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    
    let matchQuery = {};
    if (employeeId) matchQuery.employee = employeeId;
    
    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const performanceData = await Visit.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeData'
        }
      },
      { $unwind: '$employeeData' },
      {
        $group: {
          _id: '$employee',
          employeeName: { $first: '$employeeData.name' },
          employeeId: { $first: '$employeeData.employeeId' },
          totalVisits: { $sum: 1 },
          completedVisits: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalDuration: { $sum: '$duration' },
          avgDuration: { $avg: '$duration' },
          totalDistance: { $sum: '$distanceTraveled' }
        }
      },
      {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'employee',
          as: 'payments'
        }
      },
      {
        $addFields: {
          totalPayments: { $size: '$payments' },
          totalAmount: {
            $sum: {
              $map: {
                input: '$payments',
                as: 'payment',
                in: '$$payment.amount'
              }
            }
          }
        }
      },
      { $sort: { totalVisits: -1 } }
    ]);

    res.json({ performanceData });
  } catch (error) {
    console.error('Employee performance report error:', error);
    res.status(500).json({ message: 'Server error generating performance report' });
  }
});

// Daily activity report
router.get('/daily-activity', auth, async (req, res) => {
  try {
    const { date, employeeId } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    // Set date range for the day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    let matchQuery = {
      date: { $gte: startOfDay, $lte: endOfDay }
    };

    if (req.user.role === 'employee') {
      matchQuery.employee = req.user.userId;
    } else if (employeeId) {
      matchQuery.employee = employeeId;
    }

    const visits = await Visit.find(matchQuery)
      .populate('employee', 'name employeeId')
      .populate('customer', 'name phone address')
      .sort({ checkInTime: 1 });

    const payments = await Payment.find({
      employee: matchQuery.employee,
      paymentDate: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate('customer', 'name phone')
      .sort({ paymentDate: 1 });

    const summary = {
      totalVisits: visits.length,
      completedVisits: visits.filter(v => v.status === 'completed').length,
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      totalDuration: visits.reduce((sum, v) => sum + (v.duration || 0), 0),
      firstCheckIn: visits.length > 0 ? visits[0].checkInTime : null,
      lastCheckOut: visits.length > 0 ? visits[visits.length - 1].checkOutTime : null
    };

    res.json({
      date: targetDate.toISOString().split('T')[0],
      summary,
      visits,
      payments
    });
  } catch (error) {
    console.error('Daily activity report error:', error);
    res.status(500).json({ message: 'Server error generating daily report' });
  }
});

// Payment collection report
router.get('/payment-collection', auth, async (req, res) => {
  try {
    const { startDate, endDate, employeeId, method } = req.query;
    
    let matchQuery = {};
    
    if (req.user.role === 'employee') {
      matchQuery.employee = req.user.userId;
    } else if (employeeId) {
      matchQuery.employee = employeeId;
    }

    if (startDate && endDate) {
      matchQuery.paymentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (method) matchQuery.method = method;

    const paymentData = await Payment.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeData'
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerData'
        }
      },
      { $unwind: '$employeeData' },
      { $unwind: '$customerData' },
      {
        $group: {
          _id: {
            employee: '$employee',
            method: '$method'
          },
          employeeName: { $first: '$employeeData.name' },
          employeeId: { $first: '$employeeData.employeeId' },
          method: { $first: '$method' },
          totalAmount: { $sum: '$amount' },
          totalPayments: { $sum: 1 },
          payments: {
            $push: {
              amount: '$amount',
              customer: '$customerData.name',
              date: '$paymentDate',
              receiptNumber: '$receiptNumber'
            }
          }
        }
      },
      {
        $group: {
          _id: '$_id.employee',
          employeeName: { $first: '$employeeName' },
          employeeId: { $first: '$employeeId' },
          totalAmount: { $sum: '$totalAmount' },
          totalPayments: { $sum: '$totalPayments' },
          methodBreakdown: {
            $push: {
              method: '$method',
              amount: '$totalAmount',
              count: '$totalPayments'
            }
          },
          allPayments: { $push: '$payments' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    const summary = paymentData.reduce((acc, emp) => {
      acc.totalAmount += emp.totalAmount;
      acc.totalPayments += emp.totalPayments;
      return acc;
    }, { totalAmount: 0, totalPayments: 0 });

    res.json({
      summary,
      employeeData: paymentData
    });
  } catch (error) {
    console.error('Payment collection report error:', error);
    res.status(500).json({ message: 'Server error generating payment report' });
  }
});

// Customer visit frequency report
router.get('/customer-visits', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    
    let matchQuery = {};
    if (employeeId) matchQuery.employee = employeeId;
    
    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const customerVisits = await Visit.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerData'
        }
      },
      { $unwind: '$customerData' },
      {
        $group: {
          _id: '$customer',
          customerName: { $first: '$customerData.name' },
          customerPhone: { $first: '$customerData.phone' },
          assignedEmployee: { $first: '$customerData.assignedEmployee' },
          totalVisits: { $sum: 1 },
          completedVisits: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          lastVisit: { $max: '$date' },
          avgDuration: { $avg: '$duration' },
          totalPayments: {
            $sum: { $cond: [{ $ne: ['$paymentCollected', null] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedEmployee',
          foreignField: '_id',
          as: 'employeeData'
        }
      },
      { $unwind: '$employeeData' },
      {
        $addFields: {
          employeeName: '$employeeData.name',
          visitFrequency: {
            $cond: [
              { $gte: ['$totalVisits', 20] }, 'High',
              { $cond: [{ $gte: ['$totalVisits', 10] }, 'Medium', 'Low'] }
            ]
          }
        }
      },
      { $sort: { totalVisits: -1 } }
    ]);

    res.json({ customerVisits });
  } catch (error) {
    console.error('Customer visits report error:', error);
    res.status(500).json({ message: 'Server error generating customer visits report' });
  }
});

// Route efficiency report
router.get('/route-efficiency', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    
    let matchQuery = { status: 'completed' };
    if (employeeId) matchQuery.employee = employeeId;
    
    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const routeData = await Visit.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeData'
        }
      },
      { $unwind: '$employeeData' },
      {
        $group: {
          _id: {
            employee: '$employee',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
          },
          employeeName: { $first: '$employeeData.name' },
          employeeId: { $first: '$employeeData.employeeId' },
          date: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } },
          totalVisits: { $sum: 1 },
          totalDistance: { $sum: '$distanceTraveled' },
          totalDuration: { $sum: '$duration' },
          avgDistancePerVisit: { $avg: '$distanceTraveled' },
          avgDurationPerVisit: { $avg: '$duration' }
        }
      },
      { $sort: { date: -1, totalVisits: -1 } }
    ]);

    res.json({ routeData });
  } catch (error) {
    console.error('Route efficiency report error:', error);
    res.status(500).json({ message: 'Server error generating route efficiency report' });
  }
});

// Export report data as CSV
router.get('/export/:reportType', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { reportType } = req.params;
    const { startDate, endDate, employeeId } = req.query;

    let data = [];
    let filename = '';
    let headers = [];

    switch (reportType) {
      case 'payments':
        const payments = await Payment.find({
          ...(employeeId && { employee: employeeId }),
          ...(startDate && endDate && {
            paymentDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
          })
        })
        .populate('customer', 'name phone')
        .populate('employee', 'name employeeId')
        .sort({ paymentDate: -1 });

        headers = ['Date', 'Employee', 'Customer', 'Amount', 'Method', 'Receipt No', 'Status'];
        data = payments.map(p => [
          p.paymentDate.toLocaleDateString(),
          p.employee.name,
          p.customer.name,
          p.amount,
          p.method,
          p.receiptNumber,
          p.status
        ]);
        filename = 'payments_report.csv';
        break;

      case 'visits':
        const visits = await Visit.find({
          ...(employeeId && { employee: employeeId }),
          ...(startDate && endDate && {
            date: { $gte: new Date(startDate), $lte: new Date(endDate) }
          })
        })
        .populate('customer', 'name phone')
        .populate('employee', 'name employeeId')
        .sort({ date: -1 });

        headers = ['Date', 'Employee', 'Customer', 'Check In', 'Check Out', 'Duration', 'Status', 'Purpose'];
        data = visits.map(v => [
          v.date.toLocaleDateString(),
          v.employee.name,
          v.customer.name,
          v.checkInTime ? v.checkInTime.toLocaleTimeString() : '',
          v.checkOutTime ? v.checkOutTime.toLocaleTimeString() : '',
          v.duration || 0,
          v.status,
          v.purpose
        ]);
        filename = 'visits_report.csv';
        break;

      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    // Generate CSV content
    const csvContent = [headers.join(','), ...data.map(row => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ message: 'Server error exporting report' });
  }
});

module.exports = router;
