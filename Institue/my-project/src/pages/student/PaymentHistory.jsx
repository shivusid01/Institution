// src/pages/student/PaymentHistory.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { paymentAPI } from '../../services/api'
import { useLocation, useNavigate } from 'react-router-dom'

const PaymentHistory = () => {
  const { currentUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [paymentHistory, setPaymentHistory] = useState([])
  const [stats, setStats] = useState(null)
  const [viewMode, setViewMode] = useState('table') // 'table' or 'card'

  // Initial fetch - EVERY TIME component loads
  useEffect(() => {
    console.log('🔄 PaymentHistory component mounted/updated')
    fetchPaymentHistory()
  }, [currentUser])

  // Check for payment success redirect
  useEffect(() => {
    if (location.state?.paymentSuccess) {
      console.log('✅ New payment detected, refreshing...')
      // Refresh data after payment success
      fetchPaymentHistory()
      
      // Clear location state after use
      if (location.state) {
        navigate(location.pathname, { replace: true, state: {} })
      }
    }
  }, [location.state])

  // Fetch ALL payments
  const fetchPaymentHistory = async () => {
    try {
      setLoading(true)
      console.log('📡 Fetching payment history...')
      
      // Get payments from API
      const response = await paymentAPI.getStudentPayments()
      console.log('📦 API Response:', response.data)
      
      if (response.data?.success) {
        const payments = response.data.payments || []
        
        // ✅ IMPORTANT: NO FILTERING - Show ALL payments
        console.log(`✅ Found ${payments.length} payments`)
        
        setPaymentHistory(payments)
        
        // Set statistics if available
        if (response.data.stats) {
          setStats(response.data.stats)
        }
      } else {
        console.log('❌ API returned false success')
        setPaymentHistory([])
      }
    } catch (error) {
      console.error('❌ Error fetching payment history:', error)
      setPaymentHistory([])
    } finally {
      setLoading(false)
    }
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return 'Invalid Date'
    }
  }

  // Format amount
  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '₹0'
    return `₹${parseInt(amount).toLocaleString('en-IN')}`
  }

  // Get status badge
  const getStatusBadge = (status) => {
    const statusLower = (status || '').toLowerCase()
    
    switch(statusLower) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✅ Paid
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            ⏳ Pending
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            ❌ Failed
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status || 'Unknown'}
          </span>
        )
    }
  }

  // Refresh button handler
  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered')
    fetchPaymentHistory()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Success Message */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
            <p className="text-gray-600 mt-2">View all your payment records</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium"
            >
              ↻ Refresh
            </button>
            <button
              onClick={() => navigate('/student/payment')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              + New Payment
            </button>
          </div>
        </div>

        {/* Payment Success Alert */}
        {location.state?.paymentSuccess && (
          <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded-lg">
            <div className="flex items-center">
              <span className="text-green-600 text-xl mr-3">✅</span>
              <div>
                <p className="text-green-800 font-medium">
                  Payment Successful!
                </p>
                <p className="text-green-700 text-sm">
                  ₹{location.state.amount} for {location.state.month}
                </p>
                <p className="text-green-600 text-xs mt-1">
                  Transaction ID: {location.state.paymentId?.substring(0, 8)}...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg mr-4">
                <span className="text-green-600 text-xl">💰</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{stats.totalPaid?.toLocaleString('en-IN') || 0}
                </p>
                <p className="text-xs text-gray-500">
                  {stats.completed || 0} completed payments
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg mr-4">
                <span className="text-yellow-600 text-xl">⏳</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{stats.pendingAmount?.toLocaleString('en-IN') || 0}
                </p>
                <p className="text-xs text-gray-500">
                  {stats.pending || 0} pending payments
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg mr-4">
                <span className="text-red-600 text-xl">❌</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{stats.failedAmount?.toLocaleString('en-IN') || 0}
                </p>
                <p className="text-xs text-gray-500">
                  {stats.failed || 0} failed payments
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <span className="text-blue-600 text-xl">📊</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalTransactions || 0}
                </p>
                <p className="text-xs text-gray-500">
                  All payment records
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Tabs Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Payment Records</h2>
              <p className="text-sm text-gray-600 mt-1">
                Showing all payments - completed, pending, and failed
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">View:</span>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${viewMode === 'card' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Cards
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {paymentHistory.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No Payment History Found
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              You haven't made any payments yet. Make your first payment to see it here.
            </p>
            <button
              onClick={() => navigate('/student/payment')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center"
            >
              <span className="mr-2">+</span>
              Make Your First Payment
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paymentHistory.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(payment.paidDate || payment.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.description || 'Monthly Fee'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {payment.method ? `Via ${payment.method}` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.class || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.month || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {formatAmount(payment.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-mono text-gray-500">
                        {payment.razorpayPaymentId 
                          ? `${payment.razorpayPaymentId.substring(0, 8)}...`
                          : payment.paymentId || 'N/A'
                        }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Card View */
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           
{paymentHistory.map((payment) => (
  <tr key={payment._id} className="hover:bg-gray-50">
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
      {formatDate(payment.paidDate || payment.createdAt)}
    </td>
    <td className="px-6 py-4">
      <div className="text-sm font-medium text-gray-900">
        {payment.description || 'Monthly Fee'}
      </div>
      {payment.studentName && (
        <div className="text-xs text-gray-500 mt-1">
          <span className="font-medium">Student:</span> {payment.studentName}
        </div>
      )}
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="text-sm text-gray-900">
        {payment.class || 'N/A'}
      </div>
      <div className="text-xs text-gray-500">
        {/* Display class category */}
        {payment.class?.includes('Science') && 'Science Stream'}
        {payment.class?.includes('Commerce') && 'Commerce Stream'}
        {payment.class?.includes('JEE') && 'Engineering Prep'}
        {payment.class?.includes('NEET') && 'Medical Prep'}
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
      {payment.month || 'N/A'}
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="text-lg font-bold text-gray-900">
        {formatAmount(payment.amount)}
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      {getStatusBadge(payment.status)}
    </td>
  </tr>
))}
          </div>
        )}

        {/* Footer */}
        {paymentHistory.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-bold">{paymentHistory.length}</span> payment records
                </p>
              </div>
              <div className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
          <p className="font-medium mb-2">Debug Info:</p>
          <p>Payments Count: {paymentHistory.length}</p>
          <p>User ID: {currentUser?.id}</p>
          <p>Location State: {JSON.stringify(location.state || {})}</p>
        </div>
      )}
    </div>
  )
}

export default PaymentHistory