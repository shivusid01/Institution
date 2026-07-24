import React, { useState, useEffect } from 'react'
import { documentAPI, courseAPI } from '../services/api'

const UploadDocument = ({ onSuccess }) => {
  const [allClasses, setAllClasses] = useState([])

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await courseAPI.getAllCourses()
      if (response.data.success) {
        const mapped = response.data.courses
          .filter(course => course.classType === 'course' && course.status === 'active')
          .map(course => {
            const feeString = course.fee || '0';
            const firstPart = feeString.split('-')[0];
            const cleanFee = firstPart.replace(/[^0-9.]/g, '');
            const parsedFee = parseFloat(cleanFee) || 0;
            return {
              id: course.name,
              name: course.name,
              fee: parsedFee,
              category: course.category
            };
          });
        setAllClasses(mapped)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const [formData, setFormData] = useState({
    classId: '',
    topic: '',
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
      // Get the class name from selected ID
      const selectedClass = allClasses.find(cls => cls.id === formData.classId)
      const className = selectedClass ? selectedClass.name : formData.classId

      const uploadFormData = new FormData()
      uploadFormData.append('classId', formData.classId)
      uploadFormData.append('className', className)
      uploadFormData.append('topic', formData.topic)
      uploadFormData.append('description', formData.description)
      uploadFormData.append('file', formData.file)

      const response = await documentAPI.uploadDocument(uploadFormData)

      if (response.data.success) {
        setSuccess('✅ Document uploaded successfully!')
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
            
            {/* Dynamic Categories */}
            {Object.entries(
              allClasses.reduce((acc, cls) => {
                const cat = cls.category || 'General';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(cls);
                return acc;
              }, {})
            ).map(([category, items]) => (
              <optgroup key={category} label={category}>
                {items.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </optgroup>
            ))}
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
