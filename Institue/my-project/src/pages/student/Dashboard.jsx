// src/pages/student/Dashboard.jsx - UPDATED
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { classAPI, noticeAPI } from '../../services/api'

const StudentDashboard = () => {
  const { user } = useAuth()
  const [upcomingClasses, setUpcomingClasses] = useState([])
  const [liveClasses, setLiveClasses] = useState([])
  const [recentNotices, setRecentNotices] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
      fetchRecentNotices()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch upcoming classes (visible to all students)
      const upcomingResponse = await classAPI.getUpcomingClasses()
      if (upcomingResponse.data.success) {
        setUpcomingClasses(upcomingResponse.data.classes || [])
      }
      
      // Fetch live classes
      const liveResponse = await classAPI.getLiveClasses()
      if (liveResponse.data.success) {
        setLiveClasses(liveResponse.data.classes || [])
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentNotices = async () => {
    try {
      const response = await noticeAPI.getStudentNotices({
        page: 1,
        limit: 3
      })
      if (response.data.success) {
        setRecentNotices(response.data.notices || [])
        setUnreadCount(response.data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notices:', error)
    }
  }

  const handleJoinClass = async (classItem) => {
    try {
      // Join the class
      await classAPI.joinClass(classItem._id)
      
      // Open meeting link
      if (classItem.meetingLink) {
        window.open(classItem.meetingLink, '_blank', 'noopener,noreferrer')
      }
      
      // Update local state
      setLiveClasses(prev => 
        prev.map(cls => 
          cls._id === classItem._id 
            ? { ...cls, isJoined: true } 
            : cls
        )
      )
      
    } catch (error) {
      console.error('Error joining class:', error)
      alert(error.response?.data?.message || 'Failed to join class')
    }
  }

  // Format time function
  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.name || 'Student'}! 👋
            </h1>
            <p className="text-gray-600 mt-2">
              Check your upcoming classes and join live sessions
            </p>
          </div>
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Next Class:</span> {
                upcomingClasses.length > 0 
                  ? `${upcomingClasses[0].subject} at ${formatTime(upcomingClasses[0].startTime)}`
                  : 'No upcoming classes'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Live Classes Section */}
      {liveClasses.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="h-3 w-3 bg-red-500 rounded-full animate-pulse mr-3"></span>
              Live Classes
            </h2>
            <Link to="/student/classes" className="text-blue-600 hover:text-blue-700 font-medium">
              View All Classes
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveClasses.map((classItem) => (
              <div key={classItem._id} className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-6 shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                      🎥 LIVE NOW
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 mt-2">{classItem.subject}</h3>
                    <p className="text-gray-700">{classItem.topic}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <span className="text-gray-600 mr-2">👨‍🏫</span>
                      <span>{classItem.instructorName}</span>
                    </div>
                    <div className="text-gray-600">
                      {classItem.studentCount || 0} students joined
                    </div>
                  </div>

                  <button
                    onClick={() => handleJoinClass(classItem)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium flex items-center justify-center"
                  >
                    {classItem.isJoined ? (
                      <>
                        <span className="mr-2">↻</span>
                        Rejoin Class
                      </>
                    ) : (
                      <>
                        <span className="mr-2">🚀</span>
                        Join Class Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Classes Section - FULLY RESTORED */}
      <div className="card mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Upcoming Classes</h2>
          <Link to="/student/classes" className="text-blue-600 hover:text-blue-700 font-medium">
            View Full Schedule
          </Link>
        </div>
        
        {upcomingClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingClasses.slice(0, 3).map((classItem) => (
              <div key={classItem._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      📅 {classItem.subject}
                    </span>
                    <h3 className="font-bold text-gray-900 mt-2">{classItem.topic}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(classItem.startTime).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600">
                      {new Date(classItem.startTime).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">👨‍🏫</span>
                    <span>{classItem.instructorName}</span>
                  </div>

                  <button
                    onClick={() => window.open(classItem.meetingLink, '_blank')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
                  >
                    Join Class
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">📅</span>
            <p className="text-gray-600">No upcoming classes scheduled</p>
            <p className="text-sm text-gray-500 mt-1">Check back later for new classes</p>
          </div>
        )}
      </div>

      {/* Recent Notices Section - MOVED BELOW UPCOMING CLASSES */}
      <div className="card mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-gray-900">Recent Notices</h2>
            {unreadCount > 0 && (
              <span className="ml-3 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <Link to="/student/notices" className="text-blue-600 hover:text-blue-700 font-medium">
            View All →
          </Link>
        </div>

        {recentNotices.length > 0 ? (
          <div className="space-y-4">
            {recentNotices.map((notice) => (
              <div
                key={notice._id}
                className={`p-6 border rounded-xl transition-all duration-200 ${
                  !notice.isRead 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                } ${notice.isImportant ? 'border-l-4 border-l-red-500' : ''}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      {!notice.isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 mt-3 flex-shrink-0"></span>
                      )}
                      <div>
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            {notice.title}
                          </h3>
                          {notice.isImportant && (
                            <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                              ⚠️ Important
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center flex-wrap gap-4 mt-3">
                          <span className="flex items-center text-sm text-gray-600">
                            <span className="mr-2">
                              {notice.category === 'general' ? '📢' : 
                               notice.category === 'exam' ? '📝' :
                               notice.category === 'payment' ? '💰' :
                               notice.category === 'holiday' ? '🎉' :
                               notice.category === 'academic' ? '🎓' :
                               notice.category === 'event' ? '🎪' : '⚙️'}
                            </span>
                            {notice.category?.charAt(0).toUpperCase() + notice.category?.slice(1) || 'General'}
                          </span>
                          <span className="flex items-center text-sm text-gray-600">
                            <span className="mr-2">📅</span>
                            {new Date(notice.publishDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {!notice.isRead && (
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap">
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>

                <div className="prose max-w-none mb-6">
                  <p className="text-gray-700 whitespace-pre-line">
                    {notice.content}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    {notice.publishedBy?.name && (
                      <div>
                        <span className="font-medium">Posted by: </span>
                        {notice.publishedBy.name}
                      </div>
                    )}
                  </div>
                  
                  <Link 
                    to={`/student/notices/${notice._id}`} 
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Read More →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Notices Found</h3>
            <p className="text-gray-600">
              Check back later for new announcements.
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Link 
          to="/student/classes" 
          className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <span className="text-3xl mb-2">🎓</span>
          <span className="font-medium">My Classes</span>
        </Link>
        
        <Link 
          to="/student/payment" 
          className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
        >
          <span className="text-3xl mb-2">💰</span>
          <span className="font-medium">Pay Fees</span>
        </Link>
        
        <Link 
          to="/student/notices" 
          className="flex flex-col items-center justify-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
        >
          <span className="text-3xl mb-2">📢</span>
          <span className="font-medium">Notices</span>
        </Link>
        
        <Link 
          to="/student/profile" 
          className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
        >
          <span className="text-3xl mb-2">👤</span>
          <span className="font-medium">Profile</span>
        </Link>
        
        <Link 
          to="/student/payment-history" 
          className="flex flex-col items-center justify-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <span className="text-3xl mb-2">📋</span>
          <span className="font-medium">Payment History</span>
        </Link>
      </div>
    </div>
  )
}

export default StudentDashboard