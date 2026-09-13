import React, { useState, useEffect } from 'react'
import { documentAPI, courseAPI } from '../services/api'
import { DEFAULT_STUDENT_CLASSES, getGroupedClassOptions, renderGroupedClassOptions } from '../constants/classData'

const UploadDocument = ({ onSuccess, defaultCategory = 'Study Material' }) => {
  const [allClasses, setAllClasses] = useState([])
  const [extraCourses, setExtraCourses] = useState([])

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await courseAPI.getAllCourses()
      if (response.data && response.data.success) {
        const activeCourses = response.data.courses
          .filter(course => course.classType === 'course' && course.status === 'active')
        setExtraCourses(activeCourses)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const [formData, setFormData] = useState({
    classId: '',
    topic: '',
    category: defaultCategory,
    description: '',
    file: null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const [isDragging, setIsDragging] = useState(false)

  const processSelectedFile = (file) => {
    if (!file) return false;
    // Check if file is PDF
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a PDF file')
      return false;
    }
    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB')
      return false;
    }
    setFormData(prev => ({
      ...prev,
      file: file
    }))
    setError('')
    return true;
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!processSelectedFile(file)) {
        e.target.value = '' // Clear the file input
      }
    }
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'
    }
    setIsDragging(true)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'
    }
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget && e.currentTarget.contains(e.relatedTarget)) return
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    let droppedFiles = []
    if (e.dataTransfer && e.dataTransfer.items) {
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        if (e.dataTransfer.items[i].kind === 'file') {
          const file = e.dataTransfer.items[i].getAsFile()
          if (file) droppedFiles.push(file)
        }
      }
    } else if (e.dataTransfer && e.dataTransfer.files) {
      droppedFiles = Array.from(e.dataTransfer.files)
    }

    if (droppedFiles.length > 0) {
      processSelectedFile(droppedFiles[0])
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
      const className = formData.classId

      const uploadFormData = new FormData()
      uploadFormData.append('classId', formData.classId)
      uploadFormData.append('className', className)
      uploadFormData.append('topic', formData.topic)
      uploadFormData.append('category', formData.category || defaultCategory)
      uploadFormData.append('description', formData.description)
      uploadFormData.append('file', formData.file)

      const response = await documentAPI.uploadDocument(uploadFormData)

      if (response.data.success) {
        setSuccess('✅ Document uploaded successfully!')
        setFormData({
          classId: '',
          topic: '',
          category: defaultCategory,
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
      console.error('Upload error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-gradient-to-r from-blue-600 to-blue-900">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <span className="text-3xl mr-3">📤</span>
        Upload PDF Document
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 flex items-center">
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Class Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Class <span className="text-red-500">*</span>
          </label>
          <select
            name="classId"
            value={formData.classId}
            onChange={handleChange}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-medium"
            required
          >
            <option value="">-- Select a Class --</option>
            {renderGroupedClassOptions(extraCourses)}
          </select>
        </div>

        {/* Category Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Material Category <span className="text-red-500">*</span>
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
            required
          >
            <option value="Study Material">📚 Study Material</option>
            <option value="Current Affairs">📰 Current Affairs</option>
            <option value="Checked Copy">📝 Checked Copy</option>
            <option value="Results">🏆 Results</option>
          </select>
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
          <div 
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput')?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition cursor-pointer ${
              isDragging 
                ? 'border-blue-600 bg-blue-100/70 scale-[1.02] shadow-md' 
                : 'border-gray-300 hover:border-blue-600 bg-gray-50/30'
            }`}
          >
            <input
              id="fileInput"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="pointer-events-none">
              <div className="text-4xl mb-2">{isDragging ? '📥' : '📄'}</div>
              <p className="text-gray-700 font-medium">
                {isDragging ? 'Release to drop your PDF file here' : 'Click to select PDF or drag and drop file here'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Max size: 50MB (.pdf files only)</p>
              {formData.file && (
                <p className="text-sm text-green-600 mt-2 font-semibold">
                  ✅ Selected File: {formData.file.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-900 text-white rounded-lg hover:shadow-lg font-semibold transition-all duration-300 disabled:opacity-50"
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
