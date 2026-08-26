// src/pages/admin/ManageMembers.jsx
import React, { useState, useEffect } from 'react'
import { memberAPI } from '../../services/api'

const ManageMembers = () => {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    salary: '',
    subject: '',
    timing: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Fetch members on mount & when search term changes
  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const params = searchTerm ? { search: searchTerm } : {}
      const response = await memberAPI.getAllMembers(params)
      if (response.data.success) {
        setMembers(response.data.members || [])
      }
    } catch (error) {
      console.error('Error fetching members:', error)
      alert(error.response?.data?.message || 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      fetchMembers()
    }
  }

  // Open Modal for Create
  const handleOpenAddModal = () => {
    setIsEditing(false)
    setSelectedMemberId(null)
    setFormData({
      name: '',
      designation: '',
      salary: '',
      subject: '',
      timing: ''
    })
    setFormErrors({})
    setShowModal(true)
  }

  // Open Modal for Edit
  const handleOpenEditModal = (member) => {
    setIsEditing(true)
    setSelectedMemberId(member._id)
    setFormData({
      name: member.name || '',
      designation: member.designation || '',
      salary: member.salary || '',
      subject: member.subject || '',
      timing: member.timing || ''
    })
    setFormErrors({})
    setShowModal(true)
  }

  // Handle Form Change
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Validate Form
  const validateForm = () => {
    const errors = {}
    if (!formData.name.trim()) errors.name = 'Name is required'
    if (!formData.designation.trim()) errors.designation = 'Designation is required'
    if (!formData.salary.trim()) errors.salary = 'Salary is required'
    if (!formData.subject.trim()) errors.subject = 'Subject is required'
    if (!formData.timing.trim()) errors.timing = 'Timing is required'
    return errors
  }

  // Handle Submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setSubmitting(true)
    try {
      if (isEditing) {
        const response = await memberAPI.updateMember(selectedMemberId, formData)
        if (response.data.success) {
          alert('✅ Member updated successfully!')
          setShowModal(false)
          fetchMembers()
        }
      } else {
        const response = await memberAPI.createMember(formData)
        if (response.data.success) {
          alert('✅ Member added successfully!')
          setShowModal(false)
          fetchMembers()
        }
      }
    } catch (error) {
      console.error('Error saving member:', error)
      alert(error.response?.data?.message || 'Failed to save member details')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Delete
  const handleDeleteMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to delete member "${memberName}"?`)) {
      return
    }

    setActionLoading('delete-' + memberId)
    try {
      const response = await memberAPI.deleteMember(memberId)
      if (response.data.success) {
        alert('✅ Member deleted successfully!')
        fetchMembers()
      }
    } catch (error) {
      console.error('Delete member error:', error)
      alert(error.response?.data?.message || 'Failed to delete member')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Members Management</h1>
          <p className="text-gray-600 mt-1">
            Manage institute staff, faculty members, designations, salaries, subjects, and timings.
          </p>
        </div>
        <div>
          <button
            onClick={handleOpenAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
          >
            <span>➕</span> Add Member
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-96 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearch}
              placeholder="Search by name, designation, or subject..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={fetchMembers}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
            >
              <span>🔄</span> Refresh
            </button>
            <span className="text-sm font-semibold text-gray-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
              Total Members: {members.length}
            </span>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading members data...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Members Found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {searchTerm
                ? 'No members match your search criteria.'
                : 'Click "Add Member" above to add your first member.'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleOpenAddModal}
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg"
              >
                + Add First Member
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Designation
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Salary
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Timing
                  </th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member) => (
                  <tr key={member._id} className="hover:bg-gray-50 transition-colors">
                    {/* Name */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center mr-3 font-bold text-blue-700 text-sm">
                          {member.name?.charAt(0)?.toUpperCase() || 'M'}
                        </div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {member.name}
                        </div>
                      </div>
                    </td>

                    {/* Designation */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-semibold border border-blue-100">
                        {member.designation}
                      </span>
                    </td>

                    {/* Salary */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-green-700">
                        {member.salary?.startsWith('₹') ? member.salary : `₹${member.salary}`}
                      </span>
                    </td>

                    {/* Subject */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-800 font-medium">
                        {member.subject}
                      </span>
                    </td>

                    {/* Timing */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 bg-yellow-50 text-yellow-800 rounded-md text-xs font-medium border border-yellow-200">
                        ⏰ {member.timing}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditModal(member)}
                          className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-green-200 transition-colors"
                          title="Edit Member"
                        >
                          <span>✏️</span> Edit
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteMember(member._id, member.name)}
                          disabled={actionLoading === 'delete-' + member._id}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-red-200 transition-colors disabled:opacity-50"
                          title="Delete Member"
                        >
                          {actionLoading === 'delete-' + member._id ? (
                            <span className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-red-600"></span>
                          ) : (
                            <span>🗑️</span>
                          )}
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Member Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative border border-gray-100">
            {/* Close Modal Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              &times;
            </button>

            <h3 className="text-xl font-extrabold text-blue-900 mb-1">
              {isEditing ? 'Edit Member Details' : 'Add New Member'}
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              {isEditing
                ? 'Update member information below.'
                : 'Fill in the fields below to register a new staff or faculty member.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Member Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Dr. Rajesh Kumar"
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Designation Field */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Designation *
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  placeholder="e.g. Senior Faculty / Accountant / Co-ordinator"
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.designation ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.designation && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.designation}</p>
                )}
              </div>

              {/* Salary & Subject Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Salary */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Salary (per month) *
                  </label>
                  <input
                    type="text"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    placeholder="e.g. 45000"
                    className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.salary ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.salary && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.salary}</p>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Subject / Role *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="e.g. Mathematics / Administration"
                    className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.subject ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.subject && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.subject}</p>
                  )}
                </div>
              </div>

              {/* Timing Field */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Timing *
                </label>
                <input
                  type="text"
                  name="timing"
                  value={formData.timing}
                  onChange={handleInputChange}
                  placeholder="e.g. 09:00 AM - 04:00 PM"
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.timing ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.timing && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.timing}</p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                      Saving...
                    </span>
                  ) : isEditing ? (
                    'Update Member'
                  ) : (
                    'Save Member'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageMembers
