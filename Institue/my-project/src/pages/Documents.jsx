import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import UploadDocument from '../components/UploadDocument'
import DocumentList from '../components/DocumentList'
import '../styles/Documents.css'

const CATEGORIES = [
  { id: 'Study Material', label: 'Study Material', icon: '📚', desc: 'Access and manage PDF study materials for your classes' },
  { id: 'Current Affairs', label: 'Current Affairs', icon: '📰', desc: 'Daily current affairs, news updates and study notes' },
  { id: 'Checked Copy', label: 'Checked Copy', icon: '📝', desc: 'Evaluated test copies and sample answer sheets' },
  { id: 'Results', label: 'Results', icon: '🏆', desc: 'Exam results, marksheets and merit lists' }
]

const Documents = () => {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  const queryParams = new URLSearchParams(location.search)
  const categoryFromUrl = queryParams.get('category')
  
  const [activeCategory, setActiveCategory] = useState(categoryFromUrl || 'Study Material')
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (categoryFromUrl && CATEGORIES.some(c => c.id === categoryFromUrl)) {
      setActiveCategory(categoryFromUrl)
    }
  }, [categoryFromUrl])

  const handleTabChange = (catId) => {
    setActiveCategory(catId)
    setShowUploadForm(false)
    navigate(`/documents?category=${encodeURIComponent(catId)}`, { replace: true })
  }

  const handleUploadSuccess = () => {
    setShowUploadForm(false)
    setRefreshKey(prev => prev + 1)
  }

  const currentCatObj = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Category Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-md p-2 mb-8 flex flex-wrap gap-2 justify-center md:justify-start border border-gray-100">
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => handleTabChange(cat.id)}
                className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md scale-105'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>

        {/* Header Section */}
        <div className="mb-8 bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                <span>{currentCatObj.icon}</span>
                <span>{currentCatObj.label}</span>
              </h1>
              <p className="text-gray-600 mt-1 text-sm">{currentCatObj.desc}</p>
            </div>
            
            {/* Upload Button - Only for Admin/Teacher */}
            {user && (user.role === 'admin' || user.role === 'teacher') && (
              <button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-900 text-white rounded-lg hover:shadow-lg font-medium transition-all duration-300 flex-shrink-0"
              >
                <span className="text-xl">📤</span>
                <span>{showUploadForm ? 'Cancel' : `Upload ${currentCatObj.label} PDF`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Upload Form */}
        {user && (user.role === 'admin' || user.role === 'teacher') && showUploadForm && (
          <div className="mb-8">
            <UploadDocument defaultCategory={activeCategory} onSuccess={handleUploadSuccess} />
          </div>
        )}

        {/* Document List */}
        <div>
          <DocumentList key={`${activeCategory}-${refreshKey}`} category={activeCategory} userRole={user?.role} />
        </div>
      </div>
    </div>
  )
}

export default Documents
