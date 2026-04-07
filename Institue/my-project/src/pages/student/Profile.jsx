import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { authAPI, userAPI } from '../../services/api'

const StudentProfile = () => {
  const { currentUser, updateUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    parentPhone: '',
    class: '',
    address: '',
    fatherName: '',
    motherName: '',
    emergencyContact: '',
    bloodGroup: ''
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [changingPassword, setChangingPassword] = useState(false)

  // Contact admin state
  const [showContactModal, setShowContactModal] = useState(false)
  const [contactData, setContactData] = useState({
    subject: '',
    message: ''
  })
  const [sendingContact, setSendingContact] = useState(false)

  // Image upload state
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Fetch profile data
  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await authAPI.getProfile()
      
      if (response.data.success) {
        const profileData = response.data.data
        setProfile(profileData)
        
        // Set form data - ensure all fields are properly mapped
        setFormData({
          name: profileData.name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          parentPhone: profileData.parentPhone || '',
          class: profileData.class || profileData.className || '', // Handle both possible field names
          address: profileData.address || '',
          fatherName: profileData.fatherName || '',
          motherName: profileData.motherName || '',
          emergencyContact: profileData.emergencyContact || '',
          bloodGroup: profileData.bloodGroup || ''
        })
      } else {
        setMessage({ type: 'error', text: 'Failed to load profile data' })
      }
    } catch (error) {
      console.error('Fetch profile error:', error)
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load profile' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.name || !formData.phone) {
      setMessage({ type: 'error', text: 'Name and Phone number are required fields' })
      return
    }
    
    try {
      setSaving(true)
      setMessage({ type: '', text: '' })
      
      // Prepare data for update - only send fields that are supported by the backend
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        parentPhone: formData.parentPhone,
        class: formData.class,
        address: formData.address,
        fatherName: formData.fatherName,
        motherName: formData.motherName,
        emergencyContact: formData.emergencyContact,
        bloodGroup: formData.bloodGroup
      }
      
      // Remove empty fields to avoid overwriting with empty values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === '') {
          delete updateData[key]
        }
      })
      
      console.log('Sending update data:', updateData) // Debug log
      
      const response = await authAPI.updateProfile(updateData)
      
      console.log('Update response:', response) // Debug log
      
      if (response.data.success) {
        // Update local state
        setProfile(response.data.data)
        // Update auth context
        if (updateUser) {
          updateUser(response.data.data)
        }
        // Exit edit mode
        setEditing(false)
        
        setMessage({ 
          type: 'success', 
          text: 'Profile updated successfully!' 
        })
        
        // Refresh profile data to ensure consistency
        await fetchProfile()
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setMessage({ type: '', text: '' })
        }, 3000)
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to update profile' })
      }
    } catch (error) {
      console.error('Update profile error:', error)
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.response?.data?.error || 'Failed to update profile' 
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    
    // Validate passwords
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'All password fields are required' })
      return
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New password and confirm password do not match' })
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long' })
      return
    }
    
    try {
      setChangingPassword(true)
      setMessage({ type: '', text: '' })
      
      // Use the correct API endpoint for password change
      const response = await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      
      console.log('Password change response:', response) // Debug log
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' })
        setShowPasswordModal(false)
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setMessage({ type: '', text: '' })
        }, 3000)
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to change password' })
      }
    } catch (error) {
      console.error('Password change error:', error)
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.response?.data?.error || 'Failed to change password' 
      })
    } finally {
      setChangingPassword(false)
    }
  }

  const handleContactAdmin = async (e) => {
    e.preventDefault()
    
    if (!contactData.subject || !contactData.message) {
      setMessage({ type: 'error', text: 'Please provide both subject and message' })
      return
    }
    
    try {
      setSendingContact(true)
      setMessage({ type: '', text: '' })
      
      const response = await userAPI.contactAdmin({
        subject: contactData.subject,
        message: contactData.message,
        userId: profile?._id,
        userEmail: profile?.email,
        userName: profile?.name
      })
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Message sent to admin successfully!' })
        setShowContactModal(false)
        setContactData({ subject: '', message: '' })
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setMessage({ type: '', text: '' })
        }, 3000)
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to send message' })
      }
    } catch (error) {
      console.error('Contact admin error:', error)
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to send message to admin' 
      })
    } finally {
      setSendingContact(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select a valid image file' })
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size should be less than 5MB' })
        return
      }
      
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleImageUpload = async () => {
    if (!selectedImage) return
    
    try {
      setUploadingImage(true)
      setMessage({ type: '', text: '' })
      
      const formData = new FormData()
      formData.append('profileImage', selectedImage)
      
      const response = await authAPI.uploadProfileImage(formData)
      
      if (response.data.success) {
        // Update profile with new image URL
        setProfile(prev => ({
          ...prev,
          profileImage: response.data.data.profileImage
        }))
        
        // Clear image states
        setSelectedImage(null)
        setImagePreview(null)
        
        setMessage({ type: 'success', text: 'Profile image updated successfully!' })
        
        // Refresh profile data
        await fetchProfile()
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setMessage({ type: '', text: '' })
        }, 3000)
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to upload image' })
      }
    } catch (error) {
      console.error('Image upload error:', error)
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to upload image' 
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">
          View and update your personal information
        </p>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Personal Information
              </h2>
              <button
                onClick={() => setEditing(!editing)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {editing ? 'Cancel Editing' : '✏️ Edit Profile'}
              </button>
            </div>

            {editing ? (
              // Edit Form
              <form onSubmit={handleSaveProfile} className="p-6">
                {/* Profile Image Upload in Edit Mode */}
                <div className="mb-8 flex items-center space-x-6">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                      {imagePreview ? (
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="h-full w-full object-cover"
                        />
                      ) : profile?.profileImage ? (
                        <img 
                          src={profile.profileImage} 
                          alt="Profile" 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl text-blue-600 font-bold">
                          {profile?.name?.charAt(0) || 'S'}
                        </span>
                      )}
                    </div>
                    
                    {/* Image Upload Button */}
                    <label className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 cursor-pointer shadow-lg transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">Update Profile Picture</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Click the camera icon to upload a new profile picture. Max size: 5MB
                    </p>
                    
                    {/* Image Preview and Upload Actions */}
                    {imagePreview && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <p className="text-sm text-blue-800 font-medium">New profile image selected</p>
                            <p className="text-xs text-blue-600">Click "Upload Image" to save or "Cancel" to discard</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={handleImageUpload}
                              disabled={uploadingImage}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              {uploadingImage ? 'Uploading...' : 'Upload Image'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedImage(null)
                                setImagePreview(null)
                              }}
                              className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Parent Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parent's Phone
                    </label>
                    <input
                      type="tel"
                      name="parentPhone"
                      value={formData.parentPhone}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Class */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Class
                    </label>
                    <input
                      type="text"
                      name="class"
                      value={formData.class}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Contact
                    </label>
                    <input
                      type="tel"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Father's Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Father's Name
                    </label>
                    <input
                      type="text"
                      name="fatherName"
                      value={formData.fatherName}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Mother's Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mother's Name
                    </label>
                    <input
                      type="text"
                      name="motherName"
                      value={formData.motherName}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blood Group
                    </label>
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  {/* Address - Full Width */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false)
                      fetchProfile() // Reset form data
                      // Clear image states
                      setSelectedImage(null)
                      setImagePreview(null)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white inline-block mr-2"></span>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              // View Mode
              <div className="p-6">
                <div className="flex items-center mb-8">
                  {/* Profile Image Section */}
                  <div className="relative mr-6">
                    <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                      {profile?.profileImage ? (
                        <img 
                          src={profile.profileImage} 
                          alt="Profile" 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl text-blue-600 font-bold">
                          {profile?.name?.charAt(0) || 'S'}
                        </span>
                      )}
                    </div>
                    
                    {/* Image Upload Button */}
                    <label className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 cursor-pointer shadow-lg transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900">{profile?.name}</h3>
                    <p className="text-gray-600">{profile?.email}</p>
                    <p className="text-sm text-gray-500 font-mono">
                      Enrollment ID: {profile?.enrollmentId || 'N/A'}
                    </p>
                    
                    {/* Image Preview and Upload */}
                    {imagePreview && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-4">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="h-16 w-16 rounded-full object-cover border-2 border-blue-300"
                          />
                          <div className="flex-1">
                            <p className="text-sm text-blue-800 font-medium">New profile image selected</p>
                            <p className="text-xs text-blue-600">Click upload to save changes</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={handleImageUpload}
                              disabled={uploadingImage}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              {uploadingImage ? 'Uploading...' : 'Upload'}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedImage(null)
                                setImagePreview(null)
                              }}
                              className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Details */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">📋 Personal Details</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-500">Phone Number</span>
                        <p className="font-medium">{profile?.phone || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-500">Parent's Phone</span>
                        <p className="font-medium">{profile?.parentPhone || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-500">Emergency Contact</span>
                        <p className="font-medium">{profile?.emergencyContact || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-500">Blood Group</span>
                        <p className="font-medium">{profile?.bloodGroup || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Academic Details */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">🎓 Academic Details</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-500">Class</span>
                        <p className="font-medium">{profile?.class || 'Not assigned'}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-500">Enrollment Date</span>
                        <p className="font-medium">{formatDate(profile?.enrollmentDate)}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-500">Registration Date</span>
                        <p className="font-medium">{formatDate(profile?.createdAt)}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-500">Account Status</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          profile?.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : profile?.status === 'inactive'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {profile?.status?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Family Details */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">👨‍👩‍👧‍👦 Family Details</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-500">Father's Name</span>
                        <p className="font-medium">{profile?.fatherName || 'Not specified'}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-500">Mother's Name</span>
                        <p className="font-medium">{profile?.motherName || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-4 md:col-span-2">
                    <h4 className="text-lg font-semibold text-gray-900">📍 Address</h4>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="whitespace-pre-line">
                        {profile?.address || 'No address provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Stats & Actions */}
        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Stats</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-blue-700">Enrollment ID</p>
                  <p className="text-lg font-bold text-blue-800 font-mono">
                    {profile?.enrollmentId || 'N/A'}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <span className="text-blue-600">🆔</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-green-700">Total Payments</p>
                  <p className="text-lg font-bold text-green-800">
                    {formatCurrency(profile?.totalPaid || 0)}
                  </p>
                  <p className="text-xs text-green-600">
                    {profile?.totalPayments || 0} transactions
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <span className="text-green-600">💰</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm text-purple-700">Member Since</p>
                  <p className="text-lg font-bold text-purple-800">
                    {formatDate(profile?.enrollmentDate || profile?.createdAt)}
                  </p>
                  <p className="text-xs text-purple-600">
                    {profile?.enrollmentDate ? 'Enrollment date' : 'Registration date'}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <span className="text-purple-600">📅</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            
            <div className="space-y-3">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
              >
                <span className="mr-3">🔒</span>
                <span>Change Password</span>
              </button>
              
              <button
                onClick={() => setEditing(true)}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
              >
                <span className="mr-3">✏️</span>
                <span>Edit Profile</span>
              </button>
              
              <button
                onClick={fetchProfile}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
              >
                <span className="mr-3">🔄</span>
                <span>Refresh Profile</span>
              </button>
            </div>
          </div>

          {/* Contact Admin */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-3">Need Help?</h3>
            <p className="text-blue-700 text-sm mb-4">
              If any information is incorrect or needs updating, contact your admin.
            </p>
            <button
              onClick={() => setShowContactModal(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg"
            >
              Contact Admin
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Change Password</h2>
            <form onSubmit={handlePasswordChange}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password *
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password *
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Admin Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Contact Admin</h2>
            <form onSubmit={handleContactAdmin}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={contactData.subject}
                    onChange={(e) => setContactData({...contactData, subject: e.target.value})}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={contactData.message}
                    onChange={(e) => setContactData({...contactData, message: e.target.value})}
                    required
                    rows="5"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowContactModal(false)
                    setContactData({ subject: '', message: '' })
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingContact}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {sendingContact ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentProfile