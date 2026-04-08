import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import UploadDocument from '../components/UploadDocument'
import DocumentList from '../components/DocumentList'
import '../styles/Documents.css'

const Documents = () => {
  const { user, isAuthenticated } = useAuth()
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Only allow authenticated users (not public)
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-purple-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">📚 Study Materials</h1>
            <p className="text-xl text-gray-600">Please log in to access study materials</p>
          </div>
        </div>
      </div>
    )
  }

  const handleUploadSuccess = () => {
    setShowUploadForm(false)
    // Refresh the document list
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">📚 Study Materials</h1>
              <p className="text-gray-600">Access and manage PDF documents for your classes</p>
            </div>
            
            {/* Upload Button - Only for Admin/Teacher */}
            {user && (user.role === 'admin' || user.role === 'teacher') && (
              <button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-purple-900 text-white rounded-lg hover:shadow-lg font-medium transition-all duration-300"
              >
                <span className="text-xl">📤</span>
                <span>{showUploadForm ? 'Cancel' : 'Upload PDF'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Upload Form - Only Show if Admin/Teacher and clicked upload */}
        {user && (user.role === 'admin' || user.role === 'teacher') && showUploadForm && (
          <div className="mb-8">
            <UploadDocument onSuccess={handleUploadSuccess} />
          </div>
        )}

        {/* Document List */}
        <div>
          <DocumentList key={refreshKey} userRole={user?.role} />
        </div>
      </div>
    </div>
  )
}

export default Documents
