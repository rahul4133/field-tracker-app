import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Camera, Coffee, LogOut, LogIn, Calendar, Users } from 'lucide-react';
import axios from 'axios';

const Attendance = () => {
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('today');
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [teamAttendance, setTeamAttendance] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const userRole = localStorage.getItem('userRole');
  const isManager = userRole === 'manager' || userRole === 'admin';

  useEffect(() => {
    fetchTodayAttendance();
    getCurrentLocation();
    
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchAttendanceHistory();
    } else if (activeTab === 'team' && isManager) {
      fetchTeamAttendance();
    }
  }, [activeTab, isManager]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Please enable location access for attendance tracking');
        }
      );
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/attendance/today', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setAttendanceStatus(response.data);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/attendance/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setAttendanceHistory(response.data.attendance);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const fetchTeamAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/attendance/team', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setTeamAttendance(response.data);
      }
    } catch (error) {
      console.error('Error fetching team attendance:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!location) {
      alert('Please enable location access');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/attendance/checkin', {
        location,
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('Checked in successfully!');
        setNotes('');
        fetchTodayAttendance();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!location) {
      alert('Please enable location access');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/attendance/checkout', {
        location,
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('Checked out successfully!');
        setNotes('');
        fetchTodayAttendance();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Check-out failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBreakStart = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/attendance/break/start', {
        location,
        reason: 'Break'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('Break started!');
        fetchTodayAttendance();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to start break');
    } finally {
      setLoading(false);
    }
  };

  const handleBreakEnd = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/attendance/break/end', {
        location
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('Break ended!');
        fetchTodayAttendance();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to end break');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'text-green-600';
      case 'late': return 'text-yellow-600';
      case 'absent': return 'text-red-600';
      case 'half-day': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const renderTodayView = () => (
    <div className="space-y-6">
      {/* Current Time Display */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
        <div className="text-center">
          <div className="text-3xl font-bold mb-2">
            {currentTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
          <div className="text-lg opacity-90">
            {formatDate(currentTime)}
          </div>
        </div>
      </div>

      {/* Attendance Status */}
      {attendanceStatus?.attendance && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Today's Status</h3>
          <div className="grid grid-cols-2 gap-4">
            {attendanceStatus.attendance.checkIn && (
              <div className="flex items-center space-x-2">
                <LogIn className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Check In</p>
                  <p className="font-semibold">{formatTime(attendanceStatus.attendance.checkIn.time)}</p>
                </div>
              </div>
            )}
            
            {attendanceStatus.attendance.checkOut && (
              <div className="flex items-center space-x-2">
                <LogOut className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Check Out</p>
                  <p className="font-semibold">{formatTime(attendanceStatus.attendance.checkOut.time)}</p>
                </div>
              </div>
            )}
            
            {attendanceStatus.attendance.workingHours > 0 && (
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Working Hours</p>
                  <p className="font-semibold">{attendanceStatus.attendance.workingHours.toFixed(1)}h</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${
                attendanceStatus.status === 'checked-in' ? 'bg-green-500' :
                attendanceStatus.status === 'on-break' ? 'bg-yellow-500' :
                attendanceStatus.status === 'checked-out' ? 'bg-gray-500' : 'bg-red-500'
              }`} />
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-semibold capitalize">{attendanceStatus.status.replace('-', ' ')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="space-y-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes (optional)"
            className="w-full p-3 border border-gray-300 rounded-lg resize-none"
            rows="2"
          />
          
          <div className="grid grid-cols-2 gap-4">
            {attendanceStatus?.status === 'not-checked-in' && (
              <button
                onClick={handleCheckIn}
                disabled={loading || !location}
                className="flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <LogIn className="h-5 w-5" />
                <span>{loading ? 'Checking In...' : 'Check In'}</span>
              </button>
            )}
            
            {attendanceStatus?.status === 'checked-in' && (
              <>
                <button
                  onClick={handleBreakStart}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                >
                  <Coffee className="h-5 w-5" />
                  <span>Start Break</span>
                </button>
                
                <button
                  onClick={handleCheckOut}
                  disabled={loading || !location}
                  className="flex items-center justify-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <LogOut className="h-5 w-5" />
                  <span>{loading ? 'Checking Out...' : 'Check Out'}</span>
                </button>
              </>
            )}
            
            {attendanceStatus?.status === 'on-break' && (
              <button
                onClick={handleBreakEnd}
                disabled={loading}
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 col-span-2"
              >
                <Coffee className="h-5 w-5" />
                <span>End Break</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Location Status */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center space-x-2">
          <MapPin className={`h-5 w-5 ${location ? 'text-green-600' : 'text-red-600'}`} />
          <span className="text-sm">
            {location ? 'Location detected' : 'Location access required'}
          </span>
          {!location && (
            <button
              onClick={getCurrentLocation}
              className="text-blue-600 text-sm underline ml-2"
            >
              Enable Location
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderHistoryView = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Attendance History</h3>
      {attendanceHistory.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No attendance records found
        </div>
      ) : (
        <div className="space-y-3">
          {attendanceHistory.map((record) => (
            <div key={record._id} className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{formatDate(record.date)}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    {record.checkIn && (
                      <span>In: {formatTime(record.checkIn.time)}</span>
                    )}
                    {record.checkOut && (
                      <span>Out: {formatTime(record.checkOut.time)}</span>
                    )}
                    {record.workingHours > 0 && (
                      <span>Hours: {record.workingHours.toFixed(1)}h</span>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)} bg-gray-100`}>
                  {record.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTeamView = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Team Attendance</h3>
        <button
          onClick={fetchTeamAttendance}
          className="text-blue-600 text-sm underline"
        >
          Refresh
        </button>
      </div>
      
      {teamAttendance.summary && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-green-100 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{teamAttendance.summary.present}</div>
            <div className="text-sm text-green-700">Present</div>
          </div>
          <div className="bg-red-100 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{teamAttendance.summary.absent}</div>
            <div className="text-sm text-red-700">Absent</div>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">{teamAttendance.summary.late}</div>
            <div className="text-sm text-yellow-700">Late</div>
          </div>
          <div className="bg-blue-100 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{teamAttendance.summary.onTime}</div>
            <div className="text-sm text-blue-700">On Time</div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {teamAttendance.attendance?.map((record) => (
          <div key={record._id} className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{record.employee.name}</p>
                <p className="text-sm text-gray-600">ID: {record.employee.employeeId}</p>
                {record.checkIn && (
                  <p className="text-sm text-gray-600">
                    Check In: {formatTime(record.checkIn.time)}
                    {record.isLate && <span className="text-yellow-600 ml-2">(Late by {record.lateBy} min)</span>}
                  </p>
                )}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)} bg-gray-100`}>
                {record.status}
              </span>
            </div>
          </div>
        ))}
        
        {teamAttendance.absentEmployees?.map((employee) => (
          <div key={employee._id} className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-red-700">{employee.name}</p>
                <p className="text-sm text-red-600">ID: {employee.employeeId}</p>
              </div>
              <span className="px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-100">
                Absent
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Attendance Management</h1>
          <p className="text-gray-600">Track your daily attendance and working hours</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-200 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'today' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Today</span>
          </button>
          
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>History</span>
          </button>
          
          {isManager && (
            <button
              onClick={() => setActiveTab('team')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                activeTab === 'team' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Team</span>
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'today' && renderTodayView()}
        {activeTab === 'history' && renderHistoryView()}
        {activeTab === 'team' && isManager && renderTeamView()}
      </div>
    </div>
  );
};

export default Attendance;
