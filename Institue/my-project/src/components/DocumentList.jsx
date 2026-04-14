import React, { useState, useEffect } from 'react'
import { documentAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

const DocumentList = ({ userRole }) => {
  const { user } = useAuth()
  const [documents, setDocuments] = useState([])
  const [filteredDocuments, setFilteredDocuments] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    classId: '',
    topic: '',
    sortBy: 'latest'
  })
  const [expandedDoc, setExpandedDoc] = useState(null)

  // Predefined classes list (only names)
  const allClassesList = [
    { id: "class1", name: "Class 1" },
    { id: "class2", name: "Class 2" },
    { id: "class3", name: "Class 3" },
    { id: "class4", name: "Class 4" },
    { id: "class5", name: "Class 5" },
    { id: "class6", name: "Class 6" },
    { id: "class7", name: "Class 7" },
    { id: "class8", name: "Class 8" },
    { id: "class9", name: "Class 9" },
    { id: "class10", name: "Class 10" },
    { id: "class11_science", name: "Class 11 (Science)" },
    { id: "class12_science", name: "Class 12 (Science)" },
    { id: "class11_commerce", name: "Class 11 (Commerce)" },
    { id: "class12_commerce", name: "Class 12 (Commerce)" },
    { id: "competition", name: "Competition" }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [documents, filters])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      const docsResponse = await documentAPI.getAllDocuments()
      
      // Handle documents response
      const docsData = docsResponse.data.data || docsResponse.data || []
      const docsArray = Array.isArray(docsData) ? docsData : []
      setDocuments(docsArray)
      
      // Extract unique classes from documents themselves
      const uniqueClasses = []
      const classMap = new Map()
      
      docsArray.forEach(doc => {
        if (doc.classId && doc.classId._id && !classMap.has(doc.classId._id)) {
          classMap.set(doc.classId._id, {
            _id: doc.classId._id,
            title: doc.className || 'Untitled Class'
          })
          uniqueClasses.push({
            _id: doc.classId._id,
            title: doc.className || 'Untitled Class'
          })
        }
      })
      
      setClasses(uniqueClasses)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(`Failed to load documents: ${err.response?.data?.message || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = documents

    // Filter by class
    if (filters.classId) {
      filtered = filtered.filter(doc => doc.classId._id === filters.classId)
    }

    // Filter by topic
    if (filters.topic) {
      filtered = filtered.filter(doc =>
        doc.topic.toLowerCase().includes(filters.topic.toLowerCase())
      )
    }

    // Sort
    if (filters.sortBy === 'latest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } else if (filters.sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    } else if (filters.sortBy === 'popular') {
      filtered.sort((a, b) => b.downloads - a.downloads)
    }

    setFilteredDocuments(filtered)
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleResetFilters = () => {
    setFilters({
      classId: '',
      topic: '',
      sortBy: 'latest'
    })
  }

  const handleDownload = async (documentId, fileName) => {
    try {
      const response = await documentAPI.downloadDocument(documentId)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error downloading document:', err)
      alert('Failed to download document')
    }
  }

  const handleDelete = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        const response = await documentAPI.deleteDocument(documentId)
        if (response.data.success) {
          setDocuments(documents.filter(doc => doc._id !== documentId))
          alert('Document deleted successfully')
        }
      } catch (err) {
        console.error('Error deleting document:', err)
        alert('Failed to delete document')
      }
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin text-4xl mb-4">📚</div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="text-2xl mr-2">🔍</span>
          Filter Documents
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Class Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
            <select
              name="classId"
              value={filters.classId}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-medium"
            >
              <option value="">All Classes</option>
              {/* Static Classes */}
              <optgroup label="School Classes">
                {allClassesList.slice(0, 10).map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Higher Secondary">
                {allClassesList.slice(10, 14).map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Competitive">
                {allClassesList.slice(14).map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </optgroup>
              {/* Dynamic Classes from Documents */}
              {classes.length > 0 && (
                <optgroup label="Document Classes">
                  {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>
                      {cls.title}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Topic Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Topic</label>
            <input
              type="text"
              name="topic"
              value={filters.topic}
              onChange={handleFilterChange}
              placeholder="Search by topic..."
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
            />
          </div>

          {/* Sort Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-medium"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="popular">Most Downloaded</option>
            </select>
          </div>
        </div>

        {/* Reset Button */}
        {(filters.classId || filters.topic || filters.sortBy !== 'latest') && (
          <div className="flex justify-end">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium transition-all duration-200"
            >
              🔄 Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Document Count */}
      <div className="text-sm text-gray-600">
        Found <span className="font-bold text-red-600">{filteredDocuments.length}</span> document(s)
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-600 text-lg">No documents found</p>
          <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or check back later</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map(doc => (
            <div
              key={doc._id}
              className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6 border-l-4 border-red-500"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">📄</span>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{doc.title}</h3>
                      <p className="text-sm text-gray-500">
                        📚 Class: <span className="font-semibold text-gray-700">{doc.className}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Download/Delete Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(doc._id, doc.fileName)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition"
                  >
                    <span>⬇️</span>
                    Download
                  </button>

                  {/* Delete button only for admin or document author */}
                  {(userRole === 'admin' || user?._id === doc.uploadedBy._id) && (
                    <button
                      onClick={() => handleDelete(doc._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition"
                    >
                      <span>🗑️</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Topic and Details */}
              <div className="mb-4 space-y-2">
                <p className="text-gray-700">
                  <span className="font-semibold">📌 Topic:</span> {doc.topic}
                </p>
                {doc.description && (
                  <p className="text-gray-600">
                    <span className="font-semibold">📝 Description:</span> {doc.description}
                  </p>
                )}
              </div>

              {/* Meta Information */}
              <div className="flex gap-4 text-sm text-gray-500 border-t pt-4 flex-wrap">
                <span className="flex items-center gap-1">
                  <span>👨‍🏫</span>
                  {doc.uploadedByName}
                </span>
                <span className="flex items-center gap-1">
                  <span>📅</span>
                  {formatDate(doc.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <span>💾</span>
                  {formatFileSize(doc.fileSize)}
                </span>
                <span className="flex items-center gap-1">
                  <span>⬇️</span>
                  {doc.downloads} download{doc.downloads !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DocumentList