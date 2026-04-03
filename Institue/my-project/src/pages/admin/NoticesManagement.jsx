import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { noticeAPI } from '../../services/api'

const NoticesManagement = () => {
  const { user } = useAuth()
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState(null)
  const [stats, setStats] = useState(null)
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    priority: 'all',
    search: ''
  })
  
  // New notice form
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'medium',
    target: 'all',
    targetClass: '',
    publishDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    isImportant: false,
    attachments: []
  })

  // Fetch notices on component mount
  useEffect(() => {
    fetchNotices()
    fetchNoticeStats()
  }, [filters])

  const fetchNotices = async () => {
    try {
      setLoading(true)
      const params = {
        status: filters.status !== 'all' ? filters.status : undefined,
        category: filters.category !== 'all' ? filters.category : undefined,
        priority: filters.priority !== 'all' ? filters.priority : undefined,
        search: filters.search || undefined,
        page: 1,
        limit: 50
      }
      
      const response = await noticeAPI.getAllNotices(params)
      
      if (response.data.success) {
        setNotices(response.data.notices || [])
      }
    } catch (error) {
      console.error('Error fetching notices:', error)
      alert('Failed to fetch notices')
    } finally {
      setLoading(false)
    }
  }

  const fetchNoticeStats = async () => {
    try {
      const response = await noticeAPI.getNoticeStats()
      if (response.data.success) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleCreateNotice = async (e) => {
    e.preventDefault()
    
    if (!newNotice.title || !newNotice.content) {
      alert('Title and content are required!')
      return
    }

    try {
      setLoading(true)
      
      const noticeData = {
        ...newNotice,
        publishDate: newNotice.publishDate ? new Date(newNotice.publishDate) : new Date(),
        expiryDate: newNotice.expiryDate ? new Date(newNotice.expiryDate) : undefined
      }

      console.log('📤 Creating notice:', noticeData)
      
      const response = await noticeAPI.createNotice(noticeData)
      
      console.log('✅ Notice created:', response.data)
      
      if (response.data.success) {
        alert('✅ Notice created successfully!')
        
        // Reset form
        setNewNotice({
          title: '',
          content: '',
          category: 'general',
          priority: 'medium',
          target: 'all',
          targetClass: '',
          publishDate: new Date().toISOString().split('T')[0],
          expiryDate: '',
          isImportant: false,
          attachments: []
        })
        
        setShowAddModal(false)
        fetchNotices()
        fetchNoticeStats()
      }
    } catch (error) {
      console.error('❌ Create notice error:', error)
      alert(`Failed to create notice: ${error.response?.data?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateNotice = async (e) => {
    e.preventDefault()
    
    if (!selectedNotice) return
    
    try {
      setLoading(true)
      
      const updateData = {
        ...selectedNotice,
        publishDate: selectedNotice.publishDate ? new Date(selectedNotice.publishDate) : undefined,
        expiryDate: selectedNotice.expiryDate ? new Date(selectedNotice.expiryDate) : undefined
      }

      console.log('📤 Updating notice:', updateData)
      
      const response = await noticeAPI.updateNotice(selectedNotice._id, updateData)
      
      console.log('✅ Notice updated:', response.data)
      
      if (response.data.success) {
        alert('✅ Notice updated successfully!')
        setShowEditModal(false)
        setSelectedNotice(null)
        fetchNotices()
        fetchNoticeStats()
      }
    } catch (error) {
      console.error('❌ Update notice error:', error)
      alert(`Failed to update notice: ${error.response?.data?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteNotice = async (noticeId) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) {
      return
    }

    try {
      const response = await noticeAPI.deleteNotice(noticeId)
      
      if (response.data.success) {
        alert('Notice deleted successfully')
        fetchNotices()
        fetchNoticeStats()
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete notice')
    }
  }

  const handlePublishNotice = async (noticeId) => {
    if (!window.confirm('Publish this notice to students?')) {
      return
    }

    try {
      const noticeToUpdate = notices.find(n => n._id === noticeId)
      if (!noticeToUpdate) return
      
      const updateData = {
        ...noticeToUpdate,
        status: 'published',
        publishDate: new Date()
      }

      const response = await noticeAPI.updateNotice(noticeId, updateData)
      
      if (response.data.success) {
        alert('Notice published successfully!')
        fetchNotices()
        fetchNoticeStats()
      }
    } catch (error) {
      console.error('Publish error:', error)
      alert('Failed to publish notice')
    }
  }

  const handleArchiveNotice = async (noticeId) => {
    if (!window.confirm('Archive this notice?')) {
      return
    }

    try {
      const noticeToUpdate = notices.find(n => n._id === noticeId)
      if (!noticeToUpdate) return
      
      const updateData = {
        ...noticeToUpdate,
        status: 'archived'
      }

      const response = await noticeAPI.updateNotice(noticeId, updateData)
      
      if (response.data.success) {
        alert('Notice archived successfully!')
        fetchNotices()
        fetchNoticeStats()
      }
    } catch (error) {
      console.error('Archive error:', error)
      alert('Failed to archive notice')
    }
  }

  // Available classes for targeting
  const classOptions = [
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
    'Class 11 (Science)', 'Class 12 (Science)',
    'Class 11 (Commerce)', 'Class 12 (Commerce)',
    'JEE Preparation', 'NEET Preparation', 'UPSC Foundation'
  ]

  // Categories
  const categories = [
    { id: 'general', label: 'General', icon: '📢' },
    { id: 'exam', label: 'Exam', icon: '📝' },
    { id: 'payment', label: 'Payment', icon: '💰' },
    { id: 'holiday', label: 'Holiday', icon: '🎉' },
    { id: 'academic', label: 'Academic', icon: '🎓' },
    { id: 'event', label: 'Event', icon: '🎪' },
    { id: 'system', label: 'System', icon: '⚙️' }
  ]

  const priorities = [
    { id: 'low', label: 'Low', color: 'green' },
    { id: 'medium', label: 'Medium', color: 'yellow' },
    { id: 'high', label: 'High', color: 'red' }
  ]

  const statuses = [
    { id: 'all', label: 'All', color: 'gray' },
    { id: 'published', label: 'Published', color: 'green' },
    { id: 'draft', label: 'Draft', color: 'yellow' },
    { id: 'archived', label: 'Archived', color: 'gray' }
  ]

  const targets = [
    { id: 'all', label: 'All Users' },
    { id: 'students', label: 'Students Only' },
    { id: 'specific_class', label: 'Specific Class' }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notices Management</h1>
            <p className="text-gray-600 mt-2">
              Create and manage institute notices and announcements
            </p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center"
          >
            <span className="mr-2">➕</span>
            Create New Notice
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Notices</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.stats.total}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <span className="text-2xl">📢</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.stats.published}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.stats.draft}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <span className="text-2xl">📝</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Archived</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">{stats.stats.archived}</p>
              </div>
              <div className="p-3 rounded-full bg-gray-100 text-gray-600">
                <span className="text-2xl">📁</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({...filters, priority: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priorities</option>
              {priorities.map((priority) => (
                <option key={priority.id} value={priority.id}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search notices..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Notices Table */}
      <div className="card">
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
              Create your first notice to get started
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 btn-primary"
            >
              Create First Notice
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notice Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category & Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {notices.map((notice) => (
                    <tr key={notice._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {notice.title}
                            {notice.isImportant && (
                              <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                ⚠️ Important
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {notice.content}
                          </div>
                          <div className="text-xs text-gray-400 mt-2">
                            Created: {new Date(notice.createdAt).toLocaleDateString()}
                            {notice.publishedBy?.name && ` by ${notice.publishedBy.name}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                            {categories.find(c => c.id === notice.category)?.icon} {notice.category}
                          </span>
                          <div className="text-sm">
                            <span className="font-medium">Target: </span>
                            {notice.target === 'specific_class' ? notice.targetClass : notice.target}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            notice.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : notice.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {notice.status.charAt(0).toUpperCase() + notice.status.slice(1)}
                          </span>
                          <div className="text-sm">
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
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="flex items-center">
                            <span className="mr-2">👁️</span>
                            <span>{notice.views || 0} views</span>
                          </div>
                          <div className="flex items-center mt-1">
                            <span className="mr-2">📖</span>
                            <span>{notice.readBy?.length || 0} read</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Published: {notice.publishDate ? new Date(notice.publishDate).toLocaleDateString() : 'Not set'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedNotice(notice)
                              setShowEditModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          
                          {notice.status === 'draft' && (
                            <button
                              onClick={() => handlePublishNotice(notice._id)}
                              className="text-green-600 hover:text-green-700 text-sm font-medium"
                              title="Publish"
                            >
                              📤
                            </button>
                          )}
                          
                          {notice.status === 'published' && (
                            <button
                              onClick={() => handleArchiveNotice(notice._id)}
                              className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                              title="Archive"
                            >
                              📁
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteNotice(notice._id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add Notice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create New Notice</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateNotice}>
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={newNotice.title}
                      onChange={(e) => setNewNotice({...newNotice, title: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter notice title"
                      required
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content *
                    </label>
                    <textarea
                      value={newNotice.content}
                      onChange={(e) => setNewNotice({...newNotice, content: e.target.value})}
                      rows={8}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter notice content..."
                      required
                    />
                  </div>

                  {/* Settings Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={newNotice.category}
                        onChange={(e) => setNewNotice({...newNotice, category: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.icon} {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={newNotice.priority}
                        onChange={(e) => setNewNotice({...newNotice, priority: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {priorities.map((priority) => (
                          <option key={priority.id} value={priority.id}>
                            {priority.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Target */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Audience
                      </label>
                      <select
                        value={newNotice.target}
                        onChange={(e) => setNewNotice({...newNotice, target: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {targets.map((target) => (
                          <option key={target.id} value={target.id}>
                            {target.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Target Class (if specific_class) */}
                  {newNotice.target === 'specific_class' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Class *
                      </label>
                      <select
                        value={newNotice.targetClass}
                        onChange={(e) => setNewNotice({...newNotice, targetClass: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required={newNotice.target === 'specific_class'}
                      >
                        <option value="">Select a class</option>
                        {classOptions.map((cls, index) => (
                          <option key={index} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Dates Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Publish Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Publish Date
                      </label>
                      <input
                        type="date"
                        value={newNotice.publishDate}
                        onChange={(e) => setNewNotice({...newNotice, publishDate: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Expiry Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={newNotice.expiryDate}
                        onChange={(e) => setNewNotice({...newNotice, expiryDate: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Important Checkbox */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="important"
                      checked={newNotice.isImportant}
                      onChange={(e) => setNewNotice({...newNotice, isImportant: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="important" className="ml-2 text-sm text-gray-700">
                      Mark as Important Notice
                    </label>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary px-6 py-3"
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                          Creating...
                        </div>
                      ) : (
                        'Create Notice'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Notice Modal */}
      {showEditModal && selectedNotice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Notice</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedNotice(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateNotice}>
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={selectedNotice.title}
                      onChange={(e) => setSelectedNotice({...selectedNotice, title: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter notice title"
                      required
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content *
                    </label>
                    <textarea
                      value={selectedNotice.content}
                      onChange={(e) => setSelectedNotice({...selectedNotice, content: e.target.value})}
                      rows={8}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter notice content..."
                      required
                    />
                  </div>

                  {/* Settings Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={selectedNotice.category}
                        onChange={(e) => setSelectedNotice({...selectedNotice, category: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.icon} {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={selectedNotice.priority}
                        onChange={(e) => setSelectedNotice({...selectedNotice, priority: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {priorities.map((priority) => (
                          <option key={priority.id} value={priority.id}>
                            {priority.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={selectedNotice.status}
                        onChange={(e) => setSelectedNotice({...selectedNotice, status: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    {/* Target */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target
                      </label>
                      <select
                        value={selectedNotice.target}
                        onChange={(e) => setSelectedNotice({...selectedNotice, target: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {targets.map((target) => (
                          <option key={target.id} value={target.id}>
                            {target.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Target Class */}
                  {selectedNotice.target === 'specific_class' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Class *
                      </label>
                      <select
                        value={selectedNotice.targetClass}
                        onChange={(e) => setSelectedNotice({...selectedNotice, targetClass: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required={selectedNotice.target === 'specific_class'}
                      >
                        <option value="">Select a class</option>
                        {classOptions.map((cls, index) => (
                          <option key={index} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Important Checkbox */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="editImportant"
                      checked={selectedNotice.isImportant}
                      onChange={(e) => setSelectedNotice({...selectedNotice, isImportant: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="editImportant" className="ml-2 text-sm text-gray-700">
                      Mark as Important Notice
                    </label>
                  </div>

                  {/* Stats */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Notice Statistics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Views:</span>
                        <span className="ml-2 font-medium">{selectedNotice.views || 0}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Read By:</span>
                        <span className="ml-2 font-medium">{selectedNotice.readBy?.length || 0} users</span>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false)
                        setSelectedNotice(null)
                      }}
                      className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary px-6 py-3"
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                          Updating...
                        </div>
                      ) : (
                        'Update Notice'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NoticesManagement