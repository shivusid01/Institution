import React, { useState, useEffect } from 'react'
import { classAPI } from '../services/api'
import { documentAPI } from '../services/api'

const UploadDocument = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    classId: '',
    topic: '',
    description: '',
    file: null
  })
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(false)
  const [classLoading, setClassLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [classError, setClassError] = useState('')

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      setClassLoading(true)
      setClassError('')
      const response = await classAPI.getClasses()
      console.log('Classes response:', response)
      
      // Handle different response structures
      let classesData = []
      if (response.data.data && Array.isArray(response.data.data)) {
        classesData = response.data.data
      } else if (response.data && Array.isArray(response.data)) {
        classesData = response.data
      } else if (response.data.classes && Array.isArray(response.data.classes)) {
        classesData = response.data.classes
      }
      
      if (classesData.length === 0) {
        setClassError('No classes available. Please create a class first.')
      }
      setClasses(classesData)
    } catch (err) {
      console.error('Error fetching classes:', err)
      setClassError(`Error loading classes: ${err.response?.data?.message || err.message}`)
      setClasses([])
    } finally {
      setClassLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Check if file is PDF
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        setError('Please select a PDF file')
        e.target.value = '' // Clear the file input
        return
      }
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB')
        e.target.value = '' // Clear the file input
        return
      }
      setFormData(prev => ({
        ...prev,
        file: file
      }))
      setError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.classId) {
      setError('Please select a class')
      return
    }
    if (!formData.topic.trim()) {
      setError('Please enter a topic')
      return
    }
    if (!formData.file) {
      setError('Please select a PDF file')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('classId', formData.classId)
      uploadFormData.append('topic', formData.topic)
      uploadFormData.append('description', formData.description)
      uploadFormData.append('file', formData.file)

      const response = await documentAPI.uploadDocument(uploadFormData)

      if (response.data.success) {
        setSuccess('Document uploaded successfully!')
        setFormData({
          classId: '',
          topic: '',
          description: '',
          file: null
        })
        // Reset file input
        document.getElementById('fileInput').value = ''
        
        // Call onSuccess callback
        if (onSuccess) {
          setTimeout(onSuccess, 1500)
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error uploading document'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-gradient-to-r from-red-600 to-purple-900">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <span className="text-3xl mr-3">📤</span>
        Upload PDF Document
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 flex items-center">
            <span className="text-xl mr-2">⚠️</span>
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 flex items-center">
            <span className="text-xl mr-2">✅</span>
            {success}
          </p>
        </div>
      )}

      {classError && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 flex items-center">
            <span className="text-xl mr-2">⚠️</span>
            {classError}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Class Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Class <span className="text-red-500">*</span>
          </label>
          {classLoading ? (
            <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center">
              <span className="animate-spin mr-2">⏳</span>
              <span className="text-gray-600">Loading classes...</span>
            </div>
          ) : (
            <select
              name="classId"
              value={formData.classId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
              disabled={classes.length === 0}
            >
              <option value="">-- Select a Class --</option>
              {classes.map(cls => (
                <option key={cls._id} value={cls._id}>
                  {cls.title} - {cls.subject || 'N/A'}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Topic Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Topic <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            placeholder="e.g., Chapter 1: Introduction"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            required
          />
        </div>

        {/* Description Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter document description (optional)"
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          ></textarea>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            PDF File <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-500 transition">
            <input
              id="fileInput"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              required
            />
            <label htmlFor="fileInput" className="cursor-pointer">
              <div className="text-4xl mb-2">📄</div>
              <p className="text-gray-600">Click to select PDF or drag and drop</p>
              <p className="text-xs text-gray-500 mt-1">Max size: 50MB</p>
              {formData.file && (
                <p className="text-sm text-green-600 mt-2 font-semibold">
                  ✅ {formData.file.name}
                </p>
              )}
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-purple-900 text-white rounded-lg hover:shadow-lg font-semibold transition-all duration-300 disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <span className="animate-spin mr-2">⏳</span>
              Uploading...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <span className="mr-2">🚀</span>
              Upload Document
            </span>
          )}
        </button>
      </form>
    </div>
  )
}

export default UploadDocument
