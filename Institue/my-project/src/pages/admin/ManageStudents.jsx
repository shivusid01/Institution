import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { userAPI, paymentAPI } from '../../services/api'

const ManageStudents = () => {
  const { currentUser } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedClass, setSelectedClass] = useState('all')
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [messageText, setMessageText] = useState('')
  const [paymentHistory, setPaymentHistory] = useState([])
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalRevenue: 0,
    pendingFees: 0
  })
  const [availableClasses, setAvailableClasses] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalStudents, setTotalStudents] = useState(0)
  const [actionLoading, setActionLoading] = useState(null)

  // Fetch students data
  useEffect(() => {
    fetchStudents()
  }, [selectedStatus, selectedClass, currentPage])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      
      const params = {
        page: currentPage,
        limit: 10,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        class: selectedClass !== 'all' ? selectedClass : undefined,
        search: searchTerm || undefined
      }

      const response = await userAPI.getAllStudents(params)
      const data = response.data
      
      if (data.success) {
        setStudents(data.students || [])
        setTotalStudents(data.total || 0)
        setTotalPages(data.totalPages || 1)
        
        // Extract unique classes
        const classes = [...new Set(data.students.map(s => s.class).filter(Boolean))]
        setAvailableClasses(classes.sort())
        
        // Calculate stats
        const activeCount = data.students.filter(s => s.status === 'active').length
        const pendingFeesCount = data.students.filter(s => s.totalPaid === 0).length
        
        setStats({
          totalStudents: data.total || 0,
          activeStudents: activeCount,
          totalRevenue: data.students.reduce((sum, s) => sum + (s.totalPaid || 0), 0),
          pendingFees: pendingFeesCount
        })
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      alert('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      setCurrentPage(1)
      fetchStudents()
    }
  }

  const handleViewStudent = (student) => {
    setSelectedStudent(student)
    setShowStudentModal(true)
  }

  const handleViewPayments = async (student) => {
    try {
      setActionLoading('payments-' + student._id)
      const response = await userAPI.getStudentPayments(student._id)
      
      if (response.data.success) {
        setSelectedStudent(student)
        setPaymentHistory(response.data.payments || [])
        setShowPaymentModal(true)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
      alert('Failed to load payment history')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendMessageClick = (student) => {
    setSelectedStudent(student)
    setMessageText('')
    setShowMessageModal(true)
  }

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      alert('Please enter a message')
      return
    }

    try {
      setActionLoading('message')
      const response = await userAPI.sendMessage(selectedStudent._id, messageText)
      
      if (response.data.success) {
        alert('✅ Message sent successfully!')
        setShowMessageModal(false)
        setMessageText('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendCredentials = async (student) => {
    try {
      setActionLoading('credentials-' + student._id)
      const response = await userAPI.sendCredentials(student._id)
      
      if (response.data.success) {
        const creds = response.data.credentials
        
        // Copy credentials to clipboard
        const textToCopy = `
Student Login Credentials:
-------------------------
Name: ${creds.name}
Email: ${creds.email}
Enrollment ID: ${creds.enrollmentId}
Password: ${creds.password}
Login URL: ${creds.loginUrl}

Instructions:
1. Use email or enrollment ID to login
2. First time password: ${creds.password}
3. Change password after first login
        `
        
        navigator.clipboard.writeText(textToCopy)
          .then(() => {
            alert('✅ Credentials copied to clipboard!\n\n' + textToCopy)
          })
          .catch(() => {
            alert('✅ Credentials generated!\n\n' + textToCopy)
          })
      }
    } catch (error) {
      console.error('Error sending credentials:', error)
      alert('Failed to generate credentials')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeactivateStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to deactivate ${studentName}?`)) {
      return
    }

    try {
      setActionLoading('deactivate-' + studentId)
      const response = await userAPI.deactivateStudent(studentId)
      
      if (response.data.success) {
        alert('✅ Student deactivated successfully')
        fetchStudents()
      }
    } catch (error) {
      console.error('Deactivate error:', error)
      alert('Failed to deactivate student')
    } finally {
      setActionLoading(null)
    }
  }

  const handleActivateStudent = async (studentId, studentName) => {
    try {
      setActionLoading('activate-' + studentId)
      const response = await userAPI.activateStudent(studentId)
      
      if (response.data.success) {
        alert('✅ Student activated successfully')
        fetchStudents()
      }
    } catch (error) {
      console.error('Activate error:', error)
      alert('Failed to activate student')
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkCourseCompleted = async (studentId, studentName) => {
    if (!window.confirm(`Mark ${studentName}'s course as completed?`)) {
      return
    }

    try {
      setActionLoading('complete-' + studentId)
      const response = await userAPI.markCourseCompleted(studentId)
      
      if (response.data.success) {
        alert('✅ Course marked as completed!')
        fetchStudents()
      }
    } catch (error) {
      console.error('Mark completed error:', error)
      alert('Failed to mark course as completed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`Permanently delete ${studentName}? This cannot be undone!`)) {
      return
    }

    try {
      setActionLoading('delete-' + studentId)
      const response = await userAPI.deleteStudent(studentId)
      
      if (response.data.success) {
        alert('✅ Student deleted successfully')
        fetchStudents()
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete student')
    } finally {
      setActionLoading(null)
    }
  }

  const handleExportStudents = async () => {
    if (students.length === 0) {
      alert('No students to export!')
      return
    }

    try {
      setLoading(true)
      
      const params = {
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        class: selectedClass !== 'all' ? selectedClass : undefined
      }
      
      const response = await userAPI.exportStudentsCSV(params)
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `students_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      alert('✅ Students data exported successfully!')
      
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export students data')
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmail = (student) => {
    const subject = encodeURIComponent(`Your Login Credentials - ${student.name}`)
    const body = encodeURIComponent(`
Dear ${student.name},

Your login credentials for the coaching institute portal:

📝 Login Details:
• Website: ${window.location.origin}/login
• Email: ${student.email}
• Enrollment ID: ${student.enrollmentId || 'N/A'}
• Password: welcome123

📋 Instructions:
1. Visit the login page
2. Use your email or enrollment ID
3. Enter temporary password: welcome123
4. Change your password after first login

Need help? Contact admin.

Best regards,
Institute Admin
    `)
    
    window.open(`mailto:${student.email}?subject=${subject}&body=${body}`, '_blank')
  }

  const handleSendSMS = (student) => {
    const message = encodeURIComponent(
      `Hi ${student.name}, your login credentials: Email: ${student.email}, Password: welcome123. Login at ${window.location.origin}/login`
    )
    
    // Open default SMS app (mobile) or prompt
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      window.open(`sms:${student.phone}?body=${message}`, '_blank')
    } else {
      alert(`Send SMS to ${student.phone}:\n\n${decodeURIComponent(message)}`)
    }
  }

  const statusOptions = [
    { value: 'all', label: 'All Students', count: totalStudents },
    { value: 'active', label: 'Active', count: stats.activeStudents },
    { value: 'inactive', label: 'Inactive', count: totalStudents - stats.activeStudents },
    { value: 'completed', label: 'Completed', color: 'purple' }
  ]

  const classOptions = [
    { value: 'all', label: 'All Classes' },
    ...availableClasses.map(cls => ({ value: cls, label: cls }))
  ]

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedStatus('all')
    setSelectedClass('all')
    setCurrentPage(1)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Students</h1>
        <p className="text-gray-600 mt-2">
          Total {stats.totalStudents} students • {stats.activeStudents} active • {stats.pendingFees} pending fees
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Total Students</p>
              <p className="text-2xl font-bold text-blue-800 mt-1">{stats.totalStudents}</p>
              <p className="text-xs text-blue-600 mt-1">{stats.activeStudents} active</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <span className="text-2xl">👨‍🎓</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-green-800 mt-1">
                {formatCurrency(stats.totalRevenue)}
              </p>
              <p className="text-xs text-green-600 mt-1">From student payments</p>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Avg. Payment</p>
              <p className="text-2xl font-bold text-purple-800 mt-1">
                {formatCurrency(stats.totalStudents > 0 ? Math.round(stats.totalRevenue / stats.totalStudents) : 0)}
              </p>
              <p className="text-xs text-purple-600 mt-1">Per student</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Pending Fees</p>
              <p className="text-2xl font-bold text-red-800 mt-1">{stats.pendingFees}</p>
              <p className="text-xs text-red-600 mt-1">No payments yet</p>
            </div>
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearch}
                placeholder="Search by name, email, enrollment ID, or class..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </span>
              <button
                onClick={handleSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Search
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value)
                setCurrentPage(1)
              }}
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {classOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button 
              onClick={handleExportStudents}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium flex items-center"
              disabled={students.length === 0 || loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                  Exporting...
                </>
              ) : (
                <>
                  <span className="mr-2">📤</span>
                  Export CSV
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex justify-between items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Filter by Status
            </label>
            <div className="flex gap-2 flex-wrap">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSelectedStatus(option.value)
                    setCurrentPage(1)
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                    selectedStatus === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{option.label}</span>
                  {option.count !== undefined && (
                    <span className="ml-2 text-xs opacity-75">({option.count})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {(searchTerm || selectedStatus !== 'all' || selectedClass !== 'all') && (
            <button
              onClick={clearFilters}
              className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
            >
              <span className="mr-1">🗑️</span>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">All Students</h2>
            <p className="text-sm text-gray-600 mt-1">
              Page {currentPage} of {totalPages} • Showing {students.length} of {totalStudents} students
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={fetchStudents}
              className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg px-4 py-2 transition-colors"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-500"></span>
                  Refreshing...
                </>
              ) : (
                <>
                  <span>🔄</span>
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading students data...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class & Payments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <span className="text-blue-600 font-bold">
                              {student.name?.charAt(0) || 'S'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500 font-mono">
                              {student.enrollmentId || 'No ID'}
                            </div>
                            <div className="text-xs text-gray-400">
                              Joined: {formatDate(student.createdAt)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{student.email}</div>
                        <div className="text-sm text-gray-600">{student.phone}</div>
                        {student.parentPhone && (
                          <div className="text-xs text-gray-500 mt-1">
                            Parent: {student.parentPhone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {student.class || 'Not Assigned'}
                          </span>
                          <div className="mt-2">
                            <div className="text-lg font-bold text-green-600">
                              {formatCurrency(student.totalPaid || 0)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {student.paymentCount || 0} payments
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                          student.status === 'active'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : student.status === 'inactive'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : student.status === 'completed'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {student.status?.charAt(0).toUpperCase() + student.status?.slice(1) || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {/* View Details */}
                          <button
                            onClick={() => handleViewStudent(student)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 rounded"
                            title="View Details"
                          >
                            <span>👁️</span> View
                          </button>
                          
                          {/* Credentials */}
                          <button
                            onClick={() => handleSendCredentials(student)}
                            disabled={actionLoading === 'credentials-' + student._id}
                            className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center gap-1 px-3 py-1 bg-purple-50 hover:bg-purple-100 rounded disabled:opacity-50"
                            title="Send Credentials"
                          >
                            {actionLoading === 'credentials-' + student._id ? (
                              <span className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-purple-600"></span>
                            ) : (
                              <span>🔑</span>
                            )}
                            Creds
                          </button>
                          
                          {/* Payments */}
                          <button
                            onClick={() => handleViewPayments(student)}
                            disabled={actionLoading === 'payments-' + student._id}
                            className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center gap-1 px-3 py-1 bg-green-50 hover:bg-green-100 rounded disabled:opacity-50"
                            title="View Payments"
                          >
                            {actionLoading === 'payments-' + student._id ? (
                              <span className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-green-600"></span>
                            ) : (
                              <span>💰</span>
                            )}
                            Payments
                          </button>
                          
                          {/* Message */}
                          <button
                            onClick={() => handleSendMessageClick(student)}
                            className="text-teal-600 hover:text-teal-800 text-sm font-medium flex items-center gap-1 px-3 py-1 bg-teal-50 hover:bg-teal-100 rounded"
                            title="Send Message"
                          >
                            <span>💬</span> Message
                          </button>
                          
                          {/* Status Toggle */}
                          {student.status === 'active' ? (
                            <button
                              onClick={() => handleDeactivateStudent(student._id, student.name)}
                              disabled={actionLoading === 'deactivate-' + student._id}
                              className="text-yellow-600 hover:text-yellow-800 text-sm font-medium flex items-center gap-1 px-3 py-1 bg-yellow-50 hover:bg-yellow-100 rounded disabled:opacity-50"
                              title="Deactivate"
                            >
                              {actionLoading === 'deactivate-' + student._id ? (
                                <span className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-yellow-600"></span>
                              ) : (
                                <span>⏸️</span>
                              )}
                              Deactivate
                            </button>
                          ) : student.status === 'inactive' ? (
                            <button
                              onClick={() => handleActivateStudent(student._id, student.name)}
                              disabled={actionLoading === 'activate-' + student._id}
                              className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center gap-1 px-3 py-1 bg-green-50 hover:bg-green-100 rounded disabled:opacity-50"
                              title="Activate"
                            >
                              {actionLoading === 'activate-' + student._id ? (
                                <span className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-green-600"></span>
                              ) : (
                                <span>▶️</span>
                              )}
                              Activate
                            </button>
                          ) : null}
                          
                          {/* Complete Course */}
                          {student.status !== 'completed' && (
                            <button
                              onClick={() => handleMarkCourseCompleted(student._id, student.name)}
                              disabled={actionLoading === 'complete-' + student._id}
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 rounded disabled:opacity-50"
                              title="Mark Course Completed"
                            >
                              {actionLoading === 'complete-' + student._id ? (
                                <span className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-indigo-600"></span>
                              ) : (
                                <span>🎓</span>
                              )}
                              Complete
                            </button>
                          )}
                          
                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteStudent(student._id, student.name)}
                            disabled={actionLoading === 'delete-' + student._id}
                            className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1 px-3 py-1 bg-red-50 hover:bg-red-100 rounded disabled:opacity-50"
                            title="Delete Permanently"
                          >
                            {actionLoading === 'delete-' + student._id ? (
                              <span className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-red-600"></span>
                            ) : (
                              <span>🗑️</span>
                            )}
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {students.length === 0 && (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                  <span className="text-3xl">👨‍🎓</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Students Found</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {searchTerm || selectedStatus !== 'all' || selectedClass !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No students have been registered yet.'}
                </p>
                {(searchTerm || selectedStatus !== 'all' || selectedClass !== 'all') && (
                  <button
                    onClick={clearFilters}
                    className="text-blue-600 hover:text-blue-800 font-medium mt-4 flex items-center justify-center mx-auto"
                  >
                    <span className="mr-2">🗑️</span>
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && students.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * 10, totalStudents)}</span> of{' '}
                  <span className="font-medium">{totalStudents}</span> students
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    ← Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Student Details Modal */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Student Details</h2>
                <button
                  onClick={() => setShowStudentModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                    <span className="text-2xl text-blue-600 font-bold">
                      {selectedStudent.name?.charAt(0) || 'S'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h3>
                    <p className="text-gray-600">{selectedStudent.email}</p>
                    <p className="text-sm text-gray-500 font-mono">
                      ID: {selectedStudent.enrollmentId || 'No ID'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">{selectedStudent.phone || 'N/A'}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parent's Phone
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">{selectedStudent.parentPhone || 'N/A'}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Class
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">{selectedStudent.class || 'Not Assigned'}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Date
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">{formatDate(selectedStudent.createdAt)}</div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {selectedStudent.address || 'No address provided'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(selectedStudent.totalPaid || 0)}
                      </div>
                      <div className="text-sm text-gray-600">Total Paid</div>
                      <div className="text-xs text-gray-500">
                        {selectedStudent.paymentCount || 0} payments
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${
                        selectedStudent.status === 'active' ? 'text-green-600' :
                        selectedStudent.status === 'inactive' ? 'text-red-600' :
                        'text-purple-600'
                      }`}>
                        {selectedStudent.status?.toUpperCase() || 'UNKNOWN'}
                      </div>
                      <div className="text-sm text-gray-600">Account Status</div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedStudent.lastPayment ? formatDate(selectedStudent.lastPayment) : 'Never'}
                      </div>
                      <div className="text-sm text-gray-600">Last Payment</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowStudentModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleSendCredentials(selectedStudent)
                      setShowStudentModal(false)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Send Credentials
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showPaymentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Payment History</h2>
                  <p className="text-gray-600">{selectedStudent.name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setPaymentHistory([])
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              {paymentHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">💰</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Payment History</h3>
                  <p className="text-gray-600">This student hasn't made any payments yet.</p>
                </div>
              ) : (
                <>
                  <div className="mb-6 p-4 bg-green-50 rounded-lg">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm text-green-700">Total Paid</p>
                        <p className="text-2xl font-bold text-green-800">
                          {formatCurrency(paymentHistory
                            .filter(p => p.status === 'completed')
                            .reduce((sum, p) => sum + p.amount, 0))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-green-700">Total Transactions</p>
                        <p className="text-2xl font-bold text-green-800">{paymentHistory.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Description
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Transaction ID
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paymentHistory.map((payment) => (
                          <tr key={payment._id}>
                            <td className="px-4 py-3">
                              {formatDate(payment.paidDate || payment.createdAt)}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-green-600">
                                {formatCurrency(payment.amount)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {payment.description || payment.courseId?.name || 'Course Payment'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                payment.status === 'completed' 
                                  ? 'bg-green-100 text-green-800'
                                  : payment.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {payment.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-sm">
                              {payment.razorpayOrderId || payment.transactionId || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setPaymentHistory([])
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {showMessageModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Send Message</h2>
              <p className="text-gray-600 mb-6">
                To: {selectedStudent.name} ({selectedStudent.email})
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows="5"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Type your message here..."
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Message will be sent via email
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowMessageModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || actionLoading === 'message'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading === 'message' ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white inline-block mr-2"></span>
                        Sending...
                      </>
                    ) : (
                      'Send Message'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageStudents