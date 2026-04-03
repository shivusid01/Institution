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
        
        // Set form data
        setFormData({
          name: profileData.name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          parentPhone: profileData.parentPhone || '',
          class: profileData.class || '',
          address: profileData.address || '',
          fatherName: profileData.fatherName || '',
          motherName: profileData.motherName || '',
          emergencyContact: profileData.emergencyContact || '',
          bloodGroup: profileData.bloodGroup || ''
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setMessage({ type: 'error', text: 'Failed to load profile' })
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
    
    try {
      setSaving(true)
      setMessage({ type: '', text: '' })
      
      const response = await authAPI.updateProfile(formData)
      
      if (response.data.success) {
        // Update local state
        setProfile(response.data.data)
        // Update auth context
        updateUser(response.data.data)
        // Exit edit mode
        setEditing(false)
        
        setMessage({ 
          type: 'success', 
          text: 'Profile updated successfully!' 
        })
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setMessage({ type: '', text: '' })
        }, 3000)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = () => {
    // Implement password change functionality
    alert('Password change functionality will be implemented soon')
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0)
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
                    onClick={() => setEditing(false)}
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
                  <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center mr-6">
                    <span className="text-3xl text-blue-600 font-bold">
                      {profile?.name?.charAt(0) || 'S'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{profile?.name}</h3>
                    <p className="text-gray-600">{profile?.email}</p>
                    <p className="text-sm text-gray-500 font-mono">
                      Enrollment ID: {profile?.enrollmentId || 'N/A'}
                    </p>
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
                onClick={handleChangePassword}
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
              onClick={() => alert('Contact admin functionality')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg"
            >
              Contact Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentProfile