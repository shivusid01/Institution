import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { noticeAPI } from '../../services/api'

const StudentNotices = () => {
  const { user } = useAuth()
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [filters, setFilters] = useState({
    category: 'all',
    priority: 'all',
    important: 'all'
  })

  useEffect(() => {
    if (user) {
      fetchNotices()
      fetchUnreadCount()
    }
  }, [user, filters])

  const fetchNotices = async () => {
    try {
      setLoading(true)
      
      const params = {
        category: filters.category !== 'all' ? filters.category : undefined,
        priority: filters.priority !== 'all' ? filters.priority : undefined,
        important: filters.important !== 'all' ? filters.important : undefined,
        page: 1,
        limit: 50
      }
      
      const response = await noticeAPI.getStudentNotices(params)
      
      if (response.data.success) {
        setNotices(response.data.notices || [])
        setUnreadCount(response.data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notices:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await noticeAPI.getUnreadCount()
      if (response.data.success) {
        setUnreadCount(response.data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const handleMarkAsRead = async (noticeId) => {
    try {
      await noticeAPI.markNoticeAsRead(noticeId)
      
      // Update local state
      setNotices(prevNotices =>
        prevNotices.map(notice =>
          notice._id === noticeId
            ? { ...notice, isRead: true }
            : notice
        )
      )
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!window.confirm('Mark all notices as read?')) return
    
    try {
      // Mark each unread notice as read
      const unreadNotices = notices.filter(notice => !notice.isRead)
      
      for (const notice of unreadNotices) {
        await noticeAPI.markNoticeAsRead(notice._id)
      }
      
      // Update local state
      setNotices(prevNotices =>
        prevNotices.map(notice => ({
          ...notice,
          isRead: true
        }))
      )
      
      setUnreadCount(0)
      alert('All notices marked as read!')
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const categories = [
    { id: 'all', label: 'All Categories', icon: '📢' },
    { id: 'general', label: 'General', icon: '📢' },
    { id: 'exam', label: 'Exams', icon: '📝' },
    { id: 'payment', label: 'Payments', icon: '💰' },
    { id: 'holiday', label: 'Holidays', icon: '🎉' },
    { id: 'academic', label: 'Academic', icon: '🎓' },
    { id: 'event', label: 'Events', icon: '🎪' },
    { id: 'system', label: 'System', icon: '⚙️' }
  ]

  const priorities = [
    { id: 'all', label: 'All Priorities', color: 'gray' },
    { id: 'high', label: 'High', color: 'red' },
    { id: 'medium', label: 'Medium', color: 'yellow' },
    { id: 'low', label: 'Low', color: 'green' }
  ]

  const importantOptions = [
    { id: 'all', label: 'All Notices' },
    { id: 'true', label: 'Important Only' }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notices & Announcements</h1>
        <p className="text-gray-600 mt-2">
          Stay updated with important announcements, exam schedules, and institute updates.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Notices</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{notices.length}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <span className="text-2xl">📢</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unread Notices</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{unreadCount}</p>
            </div>
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <span className="text-2xl">🔔</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Important</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {notices.filter(n => n.isImportant).length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column - Filters */}
        <div>
          <div className="card mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Filters</h2>
            
            {/* Category Filter */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Category</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setFilters({...filters, category: category.id})}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center ${
                      filters.category === category.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-3">{category.icon}</span>
                    <span>{category.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Priority</h3>
              <div className="space-y-2">
                {priorities.map((priority) => (
                  <button
                    key={priority.id}
                    onClick={() => setFilters({...filters, priority: priority.id})}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center ${
                      filters.priority === priority.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`h-3 w-3 rounded-full mr-3 ${
                      priority.color === 'red' ? 'bg-red-500' :
                      priority.color === 'yellow' ? 'bg-yellow-500' :
                      priority.color === 'green' ? 'bg-green-500' :
                      'bg-gray-500'
                    }`}></div>
                    <span>{priority.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Important Filter */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Type</h3>
              <div className="space-y-2">
                {importantOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setFilters({...filters, important: option.id})}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      filters.important === option.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  unreadCount === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                ✅ Mark All as Read
              </button>
              <button
                onClick={fetchNotices}
                className="w-full text-left px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                🔄 Refresh Notices
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Notices List */}
        <div className="lg:col-span-3">
          <div className="card">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {filters.category === 'all' 
                    ? 'All Notices' 
                    : categories.find(c => c.id === filters.category)?.label
                  }
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {unreadCount} unread notice{unreadCount !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Showing {notices.length} notice{notices.length !== 1 ? 's' : ''}
                </span>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Mark All as Read
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading notices...</p>
              </div>
            ) : notices.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📭</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Notices Found</h3>
                <p className="text-gray-600">
                  There are no notices matching your filters at the moment.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {notices.map((notice) => (
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
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                notice.priority === 'high'
                                  ? 'bg-red-100 text-red-800'
                                  : notice.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {notice.priority} priority
                              </span>
                            </div>
                            
                            <div className="flex items-center flex-wrap gap-4 mt-3">
                              <span className="flex items-center text-sm text-gray-600">
                                <span className="mr-2">
                                  {categories.find(c => c.id === notice.category)?.icon}
                                </span>
                                {notice.category.charAt(0).toUpperCase() + notice.category.slice(1)}
                              </span>
                              <span className="flex items-center text-sm text-gray-600">
                                <span className="mr-2">📅</span>
                                {new Date(notice.publishDate).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                              {notice.publishedBy?.name && (
                                <span className="flex items-center text-sm text-gray-600">
                                  <span className="mr-2">👤</span>
                                  {notice.publishedBy.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {!notice.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notice._id)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
                          >
                            Mark Read
                          </button>
                        )}
                        <span className="text-xs text-gray-500">
                          {notice.views || 0} views
                        </span>
                      </div>
                    </div>

                    <div className="prose max-w-none mb-6">
                      <p className="text-gray-700 whitespace-pre-line">
                        {notice.content}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between pt-4 border-t border-gray-200 gap-4">
                      <div className="text-sm text-gray-500">
                        {notice.expiryDate && (
                          <div>
                            <span className="font-medium">Expires: </span>
                            {new Date(notice.expiryDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-4">
                        {notice.attachments && notice.attachments.length > 0 && (
                          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                            📎 {notice.attachments.length} attachment{notice.attachments.length !== 1 ? 's' : ''}
                          </button>
                        )}
                        <button className="text-sm text-gray-600 hover:text-gray-700 font-medium">
                          Share
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {notices.length > 0 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing {notices.length} notices
                </div>
                <div className="flex space-x-2">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                    ← Previous
                  </button>
                  <button className="px-4 py-2 border border-blue-500 bg-blue-50 text-blue-600 rounded-lg text-sm">
                    1
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                    2
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Important Notice Section */}
          {notices.some(n => n.isImportant) && (
            <div className="card mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-red-600 mr-2">⚠️</span>
                Important Notices
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notices
                  .filter(notice => notice.isImportant)
                  .slice(0, 4)
                  .map((notice) => (
                    <div key={notice._id} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                      <h4 className="font-bold text-red-900 mb-2">{notice.title}</h4>
                      <p className="text-sm text-red-800 line-clamp-2">
                        {notice.content}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-red-700">
                          {new Date(notice.publishDate).toLocaleDateString()}
                        </span>
                        <button className="text-xs text-red-700 hover:text-red-900 font-medium">
                          Read More →
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentNotices