import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, Download, Calendar, Users, TrendingUp, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('performance');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({});

  const tabs = [
    { id: 'performance', name: 'Employee Performance', icon: Users },
    { id: 'payments', name: 'Payment Collection', icon: TrendingUp },
    { id: 'visits', name: 'Customer Visits', icon: MapPin },
    { id: 'routes', name: 'Route Efficiency', icon: BarChart3 }
  ];

  useEffect(() => {
    fetchReportData();
  }, [activeTab, dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      switch (activeTab) {
        case 'performance':
          endpoint = '/api/reports/employee-performance';
          break;
        case 'payments':
          endpoint = '/api/reports/payment-collection';
          break;
        case 'visits':
          endpoint = '/api/reports/customer-visits';
          break;
        case 'routes':
          endpoint = '/api/reports/route-efficiency';
          break;
        default:
          endpoint = '/api/reports/employee-performance';
      }

      const response = await axios.get(endpoint, {
        params: dateRange
      });
      setReportData(response.data);
    } catch (error) {
      console.error('Fetch report error:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      const response = await axios.get(`/api/reports/export/${type}`, {
        params: dateRange,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive business insights and performance metrics</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => handleExport(activeTab === 'performance' ? 'visits' : activeTab)}
            className="btn btn-secondary"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
          <Calendar className="h-5 w-5 text-gray-400 mb-2 sm:mb-0" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                className="input"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                className="input"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 inline mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="spinner"></div>
            </div>
          ) : (
            <ReportContent activeTab={activeTab} data={reportData} />
          )}
        </div>
      </div>
    </div>
  );
};

const ReportContent = ({ activeTab, data }) => {
  switch (activeTab) {
    case 'performance':
      return <EmployeePerformanceReport data={data.performanceData || []} />;
    case 'payments':
      return <PaymentCollectionReport data={data} />;
    case 'visits':
      return <CustomerVisitsReport data={data.customerVisits || []} />;
    case 'routes':
      return <RouteEfficiencyReport data={data.routeData || []} />;
    default:
      return <EmployeePerformanceReport data={data.performanceData || []} />;
  }
};

const EmployeePerformanceReport = ({ data }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Employee Performance Overview</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Visits
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Completed
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Payments
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((employee, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{employee.employeeName}</div>
                    <div className="text-sm text-gray-500">ID: {employee.employeeId}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {employee.totalVisits}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {employee.completedVisits}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {Math.round(employee.avgDuration || 0)} min
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {employee.totalPayments}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                  ₹{employee.totalAmount || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No performance data available for the selected period</p>
        </div>
      )}
    </div>
  );
};

const PaymentCollectionReport = ({ data }) => {
  const { summary = {}, employeeData = [] } = data;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Payment Collection Summary</h3>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-green-50 rounded-lg p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Total Amount Collected</p>
              <p className="text-2xl font-bold text-green-900">₹{summary.totalAmount || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Payments</p>
              <p className="text-2xl font-bold text-blue-900">{summary.totalPayments || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Breakdown */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Payments
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Methods
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employeeData.map((employee, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{employee.employeeName}</div>
                    <div className="text-sm text-gray-500">ID: {employee.employeeId}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                  ₹{employee.totalAmount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {employee.totalPayments}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="space-y-1">
                    {employee.methodBreakdown?.map((method, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="capitalize">{method.method}:</span>
                        <span>₹{method.amount} ({method.count})</span>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CustomerVisitsReport = ({ data }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Customer Visit Analysis</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Visits
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Completed
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Visit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Frequency
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((customer, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{customer.customerName}</div>
                    <div className="text-sm text-gray-500">{customer.customerPhone}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {customer.employeeName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {customer.totalVisits}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {customer.completedVisits}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    customer.visitFrequency === 'High' 
                      ? 'bg-green-100 text-green-800'
                      : customer.visitFrequency === 'Medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {customer.visitFrequency}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const RouteEfficiencyReport = ({ data }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Route Efficiency Analysis</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Visits
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Distance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Efficiency
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((route, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{route.employeeName}</div>
                    <div className="text-sm text-gray-500">ID: {route.employeeId}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {route.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {route.totalVisits}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {(route.totalDistance || 0).toFixed(2)} km
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {Math.round(route.totalDuration || 0)} min
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {(route.avgDistancePerVisit || 0).toFixed(2)} km/visit
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
