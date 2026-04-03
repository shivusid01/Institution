import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { paymentAPI } from '../../services/api'

const PaymentRecords = () => {
  const { currentUser } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('completed') // Default to completed only
  const [selectedClass, setSelectedClass] = useState('all')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    currentMonthRevenue: 0,
    completedCount: 0,
    failedCount: 0,
    avgTransaction: 0
  })
  const [availableClasses, setAvailableClasses] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPayments, setTotalPayments] = useState(0)

  // Fetch real payment data
  useEffect(() => {
    fetchPayments()
  }, [selectedStatus, selectedClass, dateRange, currentPage])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      
      const params = {
        page: currentPage,
        limit: 10,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        class: selectedClass !== 'all' ? selectedClass : undefined,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
        search: searchTerm || undefined
      }

      console.log('📡 Fetching payments with params:', params)
      
      const response = await paymentAPI.getAllPayments(params)
      const data = response.data
      
      console.log('📊 Payment data received:', {
        success: data.success,
        count: data.count,
        total: data.total,
        paymentsLength: data.payments?.length,
        stats: data.stats
      })
      
      if (data.success) {
        setPayments(data.payments || [])
        setStats(data.stats || {
          totalRevenue: 0,
          currentMonthRevenue: 0,
          completedCount: 0,
          failedCount: 0
        })
        
        setAvailableClasses(data.filters?.availableClasses || [])
        setTotalPages(data.totalPages || 1)
        setTotalPayments(data.total || 0)
      } else {
        console.error('Failed to fetch payments:', data.message)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
      alert('Failed to load payment records. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      setCurrentPage(1)
      fetchPayments()
    }
  }

  const handleExportPayments = () => {
    if (payments.length === 0) {
      alert('No payments to export!')
      return
    }

    // Create CSV content
    const headers = ['Payment ID', 'Student Name', 'Email', 'Class', 'Amount', 'Month', 'Status', 'Payment Date', 'Transaction ID', 'Description']
    const csvRows = [
      headers.join(','),
      ...payments.map(payment => [
        payment.paymentId || payment._id,
        `"${payment.studentId?.name || payment.studentName || 'N/A'}"`,
        payment.studentId?.email || 'N/A',
        payment.class || 'N/A',
        `₹${payment.amount}`,
        payment.month || 'N/A',
        payment.status,
        new Date(payment.paidDate || payment.createdAt).toISOString().split('T')[0],
        payment.razorpayPaymentId || payment.orderId || 'N/A',
        `"${payment.description || 'Monthly Fee'}"`
      ].join(','))
    ]

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `payment_records_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    alert('Payment records exported successfully!')
  }

  const handleRefund = async (payment) => {
    if (payment.status !== 'completed') {
      alert('Only completed payments can be refunded!')
      return
    }

    if (!window.confirm(`Initiate refund for ₹${payment.amount} to ${payment.studentId?.name || payment.studentName}?`)) {
      return
    }

    try {
      const reason = prompt('Enter refund reason:', 'Customer request')
      if (!reason) return

      await paymentAPI.initiateRefund(payment._id, {
        amount: payment.amount,
        reason: reason
      })

      alert('Refund initiated successfully!')
      fetchPayments() // Refresh the list
    } catch (error) {
      console.error('Refund error:', error)
      alert('Failed to initiate refund: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleViewInvoice = (payment) => {
    // Create invoice HTML
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${payment.paymentId}</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 30px; 
            background: #f5f7fa;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.1);
            padding: 40px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #3b82f6;
          }
          .header h1 {
            color: #1e40af;
            margin: 0 0 10px 0;
            font-size: 28px;
          }
          .header p {
            color: #6b7280;
            margin: 0;
          }
          .invoice-id {
            background: #eff6ff;
            color: #1d4ed8;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: bold;
            display: inline-block;
            margin-top: 10px;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 30px 0;
          }
          .detail-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          .detail-label {
            color: #64748b;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .detail-value {
            color: #1e293b;
            font-size: 16px;
            font-weight: 600;
          }
          .amount-section {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 25px;
            border-radius: 10px;
            margin: 30px 0;
            text-align: center;
          }
          .amount-label {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 8px;
          }
          .amount {
            font-size: 36px;
            font-weight: bold;
            margin: 10px 0;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 10px;
          }
          .status-completed { background: #d1fae5; color: #065f46; }
          .status-failed { background: #fee2e2; color: #991b1b; }
          .status-refunded { background: #dbeafe; color: #1e40af; }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
          }
          @media print {
            body { padding: 0; background: white; }
            .invoice-container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="logo">EduCoach Pro</div>
            <h1>PAYMENT INVOICE</h1>
            <p>Official Receipt</p>
            <div class="invoice-id">${payment.paymentId || payment._id}</div>
          </div>
          
          <div class="details-grid">
            <div class="detail-card">
              <div class="detail-label">Student Information</div>
              <div class="detail-value">${payment.studentId?.name || payment.studentName || 'N/A'}</div>
              <div style="color: #64748b; margin-top: 8px; font-size: 14px;">
                ${payment.studentId?.email || 'N/A'}<br>
                ${payment.studentId?.enrollmentId ? `ID: ${payment.studentId.enrollmentId}` : ''}
              </div>
            </div>
            
            <div class="detail-card">
              <div class="detail-label">Payment Details</div>
              <div class="detail-value">${payment.class || 'N/A'} - ${payment.month || 'N/A'}</div>
              <div style="color: #64748b; margin-top: 8px; font-size: 14px;">
                ${new Date(payment.paidDate || payment.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}<br>
                ${new Date(payment.paidDate || payment.createdAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
          
          <div class="amount-section">
            <div class="amount-label">Amount Paid</div>
            <div class="amount">₹${payment.amount.toLocaleString('en-IN')}</div>
            <div>${payment.description || 'Monthly Fee'}</div>
            <div class="status-badge status-${payment.status}">
              ${payment.status.toUpperCase()}
            </div>
          </div>
          
          <div class="details-grid">
            <div class="detail-card">
              <div class="detail-label">Transaction ID</div>
              <div class="detail-value">${payment.razorpayPaymentId || payment.orderId || 'N/A'}</div>
            </div>
            
            <div class="detail-card">
              <div class="detail-label">Payment Method</div>
              <div class="detail-value">${payment.method ? payment.method.toUpperCase() : 'RAZORPAY'}</div>
            </div>
          </div>
          
          ${payment.refunds?.length > 0 ? `
          <div class="detail-card" style="margin-top: 20px;">
            <div class="detail-label">Refunds</div>
            ${payment.refunds.map(refund => `
              <div style="margin-top: 10px; padding: 10px; background: #fef3c7; border-radius: 6px;">
                <div><strong>₹${refund.amount}</strong> - ${refund.reason || 'N/A'}</div>
                <div style="font-size: 12px; color: #92400e; margin-top: 5px;">
                  ${new Date(refund.date).toLocaleDateString()} - ${refund.status}
                </div>
              </div>
            `).join('')}
          </div>
          ` : ''}
          
          <div class="footer">
            <p>This is a computer-generated invoice. No signature required.</p>
            <p>EduCoach Pro Institute | accounts@educoachpro.com | +91 9876543210</p>
            <p>123 Education Street, Knowledge City, Delhi - 110001</p>
            <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
              Invoice generated on ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            // Auto-print on load
            // window.print();
          };
        </script>
      </body>
      </html>
    `
    
    // Open in new window
    const invoiceWindow = window.open('', '_blank', 'width=900,height=700')
    if (invoiceWindow) {
      invoiceWindow.document.write(invoiceHTML)
      invoiceWindow.document.close()
    }
  }

  const statusOptions = [
    { value: 'completed', label: 'Completed', count: stats.completedCount },
    { value: 'failed', label: 'Failed', count: stats.failedCount },
    { value: 'refunded', label: 'Refunded', count: 0 }
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
    }).format(amount)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Payment Records</h1>
        <p className="text-gray-600 mt-2">
          View all completed and failed payment transactions. Pending payments are not shown.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-green-800 mt-1">
                {formatCurrency(stats.totalRevenue || 0)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Current Month: {formatCurrency(stats.currentMonthRevenue || 0)}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Successful Transactions</p>
              <p className="text-2xl font-bold text-blue-800 mt-1">{stats.completedCount || 0}</p>
              <p className="text-xs text-blue-600 mt-1">
                {stats.avgTransaction > 0 ? `Avg: ${formatCurrency(Math.round(stats.avgTransaction))}` : 'No transactions'}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 font-medium">Total Records</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{totalPayments}</p>
              <p className="text-xs text-gray-600 mt-1">
                {stats.failedCount || 0} failed transactions
              </p>
            </div>
            <div className="p-3 rounded-full bg-gray-100 text-gray-600">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearch}
                placeholder="Search by student name, email, class, or transaction ID..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </span>
              <button
                onClick={handleSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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
          </div>
        </div>

        {/* Status Filter & Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payment Status
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
                      ? option.value === 'completed'
                        ? 'bg-green-600 text-white'
                        : option.value === 'failed'
                        ? 'bg-red-600 text-white'
                        : 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{option.label}</span>
                  {option.count > 0 && (
                    <span className="ml-2 text-xs opacity-75">({option.count})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => {
                  setDateRange({...dateRange, start: e.target.value})
                  setCurrentPage(1)
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => {
                  setDateRange({...dateRange, end: e.target.value})
                  setCurrentPage(1)
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setDateRange({ start: '', end: '' })
                  setCurrentPage(1)
                }}
                className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg px-4 py-2 transition-colors"
              >
                Clear Dates
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Payment Transactions</h2>
            <p className="text-sm text-gray-600 mt-1">
              Showing real payment records from database
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={fetchPayments}
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
            <button 
              onClick={handleExportPayments}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 transition-colors"
              disabled={payments.length === 0 || loading}
            >
              <span>📤</span>
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading payment records...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Information
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class & Month
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
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
                  {payments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {payment.paymentId || payment._id.toString().substring(0, 8).toUpperCase()}
                          </div>
                          <div className="text-sm text-gray-500 font-mono mt-1">
                            {payment.razorpayPaymentId || payment.orderId}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                            {payment.method || 'razorpay'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {payment.studentId?.name || payment.studentName || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {payment.studentId?.email || 'N/A'}
                          </div>
                          {payment.studentId?.enrollmentId && (
                            <div className="text-xs text-gray-400 mt-1">
                              ID: {payment.studentId.enrollmentId}
                            </div>
                          )}
                          {payment.studentId?.phone && (
                            <div className="text-xs text-gray-400">
                              📱 {payment.studentId.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{payment.class || 'N/A'}</div>
                          <div className="text-sm text-gray-600">{payment.month || 'N/A'}</div>
                          <div className="text-xs text-gray-400 mt-1 truncate max-w-[200px]">
                            {payment.description || 'Monthly Fee'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 text-lg">
                          {formatCurrency(payment.amount)}
                        </div>
                        {payment.refunds?.length > 0 && (
                          <div className="text-xs text-red-600 mt-1">
                            Refunded: {formatCurrency(payment.refunds.reduce((sum, r) => sum + r.amount, 0))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-gray-900 font-medium">
                            {formatDate(payment.paidDate || payment.createdAt)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatTime(payment.paidDate || payment.createdAt)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                          payment.status === 'completed'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : payment.status === 'failed'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : payment.status === 'refunded'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleViewInvoice(payment)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                          >
                            <span>📄</span>
                            Invoice
                          </button>
                          {payment.status === 'completed' && !payment.refunds?.length && (
                            <button
                              onClick={() => handleRefund(payment)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                            >
                              <span>↩️</span>
                              Refund
                            </button>
                          )}
                          {payment.refunds?.length > 0 && (
                            <span className="text-xs text-gray-500 italic">
                              Refunded
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {payments.length === 0 && (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                  <span className="text-3xl">💳</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedStatus === 'completed' ? 'No Completed Payments' : 
                   selectedStatus === 'failed' ? 'No Failed Payments' : 
                   'No Payment Records'}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  {searchTerm || selectedClass !== 'all' || dateRange.start || dateRange.end
                    ? 'Try adjusting your search or filter criteria.'
                    : selectedStatus === 'completed' 
                    ? 'No completed payments found in the database.'
                    : 'No payment records match your criteria.'}
                </p>
                {(searchTerm || selectedClass !== 'all' || dateRange.start || dateRange.end) && (
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedClass('all')
                      setDateRange({ start: '', end: '' })
                      setSelectedStatus('completed')
                      setCurrentPage(1)
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear all filters →
                  </button>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && payments.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * 10, totalPayments)}</span> of{' '}
                  <span className="font-medium">{totalPayments}</span> payments
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  >
                    <span>←</span>
                    Previous
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
                              : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
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
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  >
                    Next
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default PaymentRecords