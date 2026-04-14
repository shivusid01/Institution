import React, { useState } from 'react'
import { documentAPI } from '../services/api'

const UploadDocument = ({ onSuccess }) => {
  // All classes available for document upload (same as Payment form)
  const allClasses = [
    { id: "class1", name: "Class 1", fee: 400 },
    { id: "class2", name: "Class 2", fee: 400 },
    { id: "class3", name: "Class 3", fee: 400 },
    { id: "class4", name: "Class 4", fee: 600 },
    { id: "class5", name: "Class 5", fee: 600 },
    { id: "class6", name: "Class 6", fee: 600 },
    { id: "class7", name: "Class 7", fee: 800 },
    { id: "class8", name: "Class 8", fee: 800 },
    { id: "class9", name: "Class 9", fee: 1000 },
    { id: "class10", name: "Class 10", fee: 1000 },
    { id: "class11_science", name: "Class 11 (Science)", fee: 1500 },
    { id: "class12_science", name: "Class 12 (Science)", fee: 1500 },
    { id: "class11_commerce", name: "Class 11 (Commerce)", fee: 1200 },
    { id: "class12_commerce", name: "Class 12 (Commerce)", fee: 1200 },
    { id: "competition", name: "Competition", fee: 1000 },
  ]

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
            
            {/* Primary Classes (1-5) */}
            <optgroup label="Primary School (Classes 1-5)">
              <option value="class1">Class 1</option>
              <option value="class2">Class 2</option>
              <option value="class3">Class 3</option>
              <option value="class4">Class 4</option>
              <option value="class5">Class 5</option>
            </optgroup>
            
            {/* Middle School (6-8) */}
            <optgroup label="Middle School (Classes 6-8)">
              <option value="class6">Class 6</option>
              <option value="class7">Class 7</option>
              <option value="class8">Class 8</option>
            </optgroup>
            
            {/* High School (9-10) */}
            <optgroup label="High School (Classes 9-10)">
              <option value="class9">Class 9</option>
              <option value="class10">Class 10</option>
            </optgroup>
            
            {/* Senior Secondary - Science */}
            <optgroup label="Senior Secondary (Science)">
              <option value="class11_science">Class 11 (Science)</option>
              <option value="class12_science">Class 12 (Science)</option>
            </optgroup>
            
            {/* Senior Secondary - Commerce */}
            <optgroup label="Senior Secondary (Commerce)">
              <option value="class11_commerce">Class 11 (Commerce)</option>
              <option value="class12_commerce">Class 12 (Commerce)</option>
            </optgroup>
            
            {/* Competitive Exams */}
            <optgroup label="Competitive Exams">
              <option value="competition">Competition</option>
            </optgroup>
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
