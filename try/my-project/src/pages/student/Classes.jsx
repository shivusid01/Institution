// src/pages/student/Classes.jsx - UPDATED
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { classAPI } from '../../services/api'

const StudentClasses = () => {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [allClasses, setAllClasses] = useState([])
  const [upcomingClasses, setUpcomingClasses] = useState([])
  const [recordedClasses, setRecordedClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchClasses()
    }
  }, [user])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      
      // Get all classes
      const response = await classAPI.getClasses()
      if (response.data.success) {
        const classes = response.data.classes || []
        setAllClasses(classes)
        
        // Filter upcoming and live classes
        const now = new Date()
        const upcoming = classes.filter(cls => 
          cls.status === 'upcoming' || cls.status === 'live'
        )
        setUpcomingClasses(upcoming)
        
        // Filter recorded/completed classes
        const recorded = classes.filter(cls => 
          cls.status === 'completed' && cls.recordingLink
        )
        setRecordedClasses(recorded)
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinClass = async (classItem) => {
    try {
      await classAPI.joinClass(classItem._id)
      window.open(classItem.meetingLink, '_blank')
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to join class')
    }
  }

  // Format functions
  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Online Classes</h1>
        <p className="text-gray-600 mt-2">
          Access all scheduled classes and recordings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Upcoming Classes and All Classes */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Classes Section */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Upcoming Classes</h2>
            {upcomingClasses.length > 0 ? (
              <div className="space-y-4">
                {upcomingClasses.map((classItem) => {
                  const now = new Date()
                  const startTime = new Date(classItem.startTime)
                  const isLive = classItem.status === 'live'
                  
                  return (
                    <div key={classItem._id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center mb-2">
                            <span className={`h-3 w-3 rounded-full mr-2 ${
                              isLive ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
                            }`}></span>
                            <span className="text-sm font-medium text-gray-500 uppercase">
                              {isLive ? 'LIVE' : 'UPCOMING'}
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-900">{classItem.subject || classItem.name}</h3>
                          <p className="text-gray-700 mt-1">{classItem.topic || classItem.description}</p>
                          <div className="flex items-center mt-3 text-sm text-gray-600">
                            <span className="mr-4">👨‍🏫 {classItem.instructor || classItem.instructorName}</span>
                            <span>🕐 {formatDateTime(classItem.startTime)}</span>
                          </div>
                        </div>
                        <div>
                          {isLive ? (
                            <button 
                              onClick={() => handleJoinClass(classItem)}
                              className="btn-primary whitespace-nowrap"
                            >
                              Join Now
                            </button>
                          ) : (
                            <button className="btn-secondary whitespace-nowrap">
                              Starts at {formatTime(classItem.startTime)}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No upcoming classes at the moment</p>
              </div>
            )}
          </div>

          {/* Classes History - All Classes Including Completed */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Classes History</h2>
            
            {allClasses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Topic</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Scheduled Time</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Instructor</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Duration</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allClasses.map((classItem) => {
                      const isLive = classItem.status === 'live'
                      const isUpcoming = classItem.status === 'upcoming'
                      const isCompleted = classItem.status === 'completed'
                      
                      const statusConfig = {
                        'upcoming': { label: 'Upcoming', color: 'bg-blue-100 text-blue-800' },
                        'live': { label: 'Live', color: 'bg-red-100 text-red-800' },
                        'completed': { label: 'Inactive', color: 'bg-gray-100 text-gray-800' }
                      }
                      
                      const status = statusConfig[classItem.status] || { label: classItem.status, color: 'bg-gray-100 text-gray-800' }
                      
                      return (
                        <tr key={classItem._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{classItem.subject || classItem.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{classItem.topic || classItem.description}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(classItem.startTime)}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{classItem.instructor || classItem.instructorName}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{classItem.duration} mins</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isLive ? (
                              <button 
                                onClick={() => handleJoinClass(classItem)}
                                className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                              >
                                Join
                              </button>
                            ) : isUpcoming ? (
                              <button className="text-gray-500 text-sm cursor-not-allowed">
                                Scheduled
                              </button>
                            ) : (
                              <button className="text-gray-500 text-sm cursor-not-allowed">
                                Completed
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No classes found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Stats */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Your Statistics</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Total Classes</span>
                <span className="font-bold text-blue-600">{allClasses.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Upcoming</span>
                <span className="font-bold text-yellow-600">{upcomingClasses.filter(c => c.status === 'upcoming').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Live</span>
                <span className="font-bold text-red-600">{upcomingClasses.filter(c => c.status === 'live').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Completed</span>
                <span className="font-bold text-gray-600">{allClasses.filter(c => c.status === 'completed').length}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {upcomingClasses.filter(c => c.status === 'live').length > 0 && (
                <button 
                  onClick={() => handleJoinClass(upcomingClasses.find(c => c.status === 'live'))}
                  className="w-full btn-primary py-3"
                >
                  🎥 Join Live Class
                </button>
              )}
              <button className="w-full btn-secondary py-3">
                📚 Study Material
              </button>
              <button className="w-full btn-secondary py-3">
                ❓ Ask Doubt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentClasses