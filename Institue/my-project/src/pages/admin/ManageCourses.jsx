// src/pages/admin/ManageCourses.jsx
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { courseAPI, classAPI } from '../../services/api'
import { format } from 'date-fns'

const ManageCourses = () => {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState([])
  const [upcomingClasses, setUpcomingClasses] = useState([])

  // Available classes and courses for selection
  const availableOptions = [
    { id: "class1", name: "Class 1", type: "class", category: "School" },
    { id: "class2", name: "Class 2", type: "class", category: "School" },
    { id: "class3", name: "Class 3", type: "class", category: "School" },
    { id: "class4", name: "Class 4", type: "class", category: "School" },
    { id: "class5", name: "Class 5", type: "class", category: "School" },
    { id: "class6", name: "Class 6", type: "class", category: "School" },
    { id: "class7", name: "Class 7", type: "class", category: "School" },
    { id: "class8", name: "Class 8", type: "class", category: "School" },
    { id: "class9", name: "Class 9", type: "class", category: "School" },
    { id: "class10", name: "Class 10", type: "class", category: "School" },
    { id: "class11_science", name: "Class 11 (Science)", type: "class", category: "Science" },
    { id: "class12_science", name: "Class 12 (Science)", type: "class", category: "Science" },
    { id: "class11_commerce", name: "Class 11 (Commerce)", type: "class", category: "Commerce" },
    { id: "class12_commerce", name: "Class 12 (Commerce)", type: "class", category: "Commerce" },
    { id: "bcom1", name: "B.COM 1st Year", type: "class", category: "Commerce" },
    { id: "bcom2", name: "B.COM 2nd Year", type: "class", category: "Commerce" },
    { id: "bcom3", name: "B.COM 3rd Year", type: "class", category: "Commerce" },
    { id: "mcom", name: "M.COM", type: "class", category:
      "Commerce" },
    { id: "competition", name: "Competition", type: "class", category: "Competitive Exams" },
  ];

  // Mock Instructor Names (Select Option)
  const instructorOptions = [
    { id: 1, name: "Mr. Jeetlal Sharma " },
    { id: 2, name: "Ashok Sharma" },
    { id: 3, name: "Chandra Bhushan Kumar" },
    { id: 4, name: "Meenu sharma" },
  ];

  // Time Duration Options
  const durationOptions = [
    { value: 30, label: "30 minutes" },
    { value: 45, label: "45 minutes" },
    { value: 60, label: "60 minutes" },
    { value: 90, label: "90 minutes" },
    { value: 120, label: "120 minutes" },
  ];

  const [newCourse, setNewCourse] = useState({
    selectedOption: '',
    name: '',
    description: '',
    instructor: '',
    instructorName: '',
    status: 'active',
    meetingLink: '',
    startTime: '',
    duration: 60,
    topic: '',
    meetingPlatform: 'google_meet'
  })

  // Fetch courses and upcoming classes
  useEffect(() => {
    fetchCourses()
    fetchUpcomingClasses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await courseAPI.getAllCourses()
      if (response.data.success) {
        setCourses(response.data.courses || [])
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUpcomingClasses = async () => {
    try {
      const response = await classAPI.getUpcomingClasses()
      if (response.data.success) {
        setUpcomingClasses(response.data.classes || [])
      }
    } catch (error) {
      console.error('Error fetching upcoming classes:', error)
    }
  }

 const handleAddCourse = async () => {
  console.log('🔍 handleAddCourse called');
  console.log('Topic value:', newCourse.topic);

  if (!newCourse.selectedOption) {
    alert('Please select a class or course');
    return;
  }

  if (!newCourse.topic || newCourse.topic.trim() === '') {
    alert('Please enter class topic');
    return;
  }

  if (!newCourse.startTime) {
    alert('Please select start time');
    return;
  }

  if (!newCourse.meetingLink) {
    alert('Please provide meeting link');
    return;
  }

  try {
    setLoading(true);

    const selectedOption = availableOptions.find(
      opt => opt.id === newCourse.selectedOption
    );

    // =========================
    // 1️⃣ CREATE COURSE FIRST
    // =========================
    await courseAPI.createCourse({
      name: selectedOption ? selectedOption.name : newCourse.name,
      category: selectedOption ? selectedOption.category : 'General',
      instructor: newCourse.instructorName,
      description:
        newCourse.description ||
        `Course for ${selectedOption?.name || 'New Course'}`,
      status: 'active'
    });

    console.log('✅ Course created successfully');

    // =========================
    // 2️⃣ CREATE CLASS
    // =========================
    const classData = {
      title: selectedOption ? selectedOption.name : newCourse.name,
      description:
        newCourse.description ||
        `Class for ${selectedOption?.name || 'New Class'}`,
      category: selectedOption ? selectedOption.category : 'General',
      subject: selectedOption ? selectedOption.name : newCourse.name,
      topic: newCourse.topic.trim(),
      startTime: newCourse.startTime,
      duration: newCourse.duration,
      meetingLink: newCourse.meetingLink,
      meetingPlatform: newCourse.meetingPlatform,
      instructorName: newCourse.instructorName,
      instructorId: currentUser._id,
      targetAudience: ['all'],
      visibility: 'all_students'
    };

    console.log('📤 Sending class data:', classData);

    const response = await classAPI.createClass(classData);

    console.log('✅ Class Response:', response.data);

    if (response.data.success) {
      alert('✅ Course & Class scheduled successfully!');

      setShowAddModal(false);
      resetNewCourseForm();

      await Promise.all([
        fetchCourses(),
        fetchUpcomingClasses()
      ]);
    }

  } catch (error) {
    console.error('❌ Error scheduling class:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    if (error.response?.data?.message) {
      alert(`Error: ${error.response.data.message}`);
    } else {
      alert('Failed to schedule class. Please check console.');
    }

  } finally {
    setLoading(false);
  }
};

  // ✅ NEW FUNCTION: Delete Class
  const handleDeleteClass = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this class? This will remove it from student dashboards as well.')) {
      return;
    }

    try {
      // First, remove from upcoming classes in state
      setUpcomingClasses(prev => prev.filter(cls => cls._id !== classId));
      
      // Try to delete from backend
      try {
        await classAPI.deleteClass(classId);
        console.log('✅ Class deleted from backend');
      } catch (backendError) {
        console.warn('⚠️ Backend delete failed, but removed from local state:', backendError.message);
      }
      
      // Also remove from localStorage if exists
      const storedClasses = JSON.parse(localStorage.getItem('scheduledClasses') || '[]');
      const updatedClasses = storedClasses.filter(cls => cls._id !== classId);
      localStorage.setItem('scheduledClasses', JSON.stringify(updatedClasses));
      
      alert('✅ Class deleted successfully! It will no longer appear in student dashboards.');
      
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('Failed to delete class. Please try again.');
    }
  };

  const handleEditCourse = async () => {
    try {
      setLoading(true)
      
      const courseData = {
        name: newCourse.name,
        instructor: newCourse.instructorName,
        description: newCourse.description,
        status: newCourse.status
      }

      const response = await courseAPI.updateCourse(selectedCourse._id, courseData)
      
      if (response.data.success) {
        alert('Course updated successfully!')
        setShowEditModal(false)
        fetchCourses()
      }
    } catch (error) {
      console.error('Error updating course:', error)
      alert(error.response?.data?.message || 'Failed to update course')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCourse = async (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        const response = await courseAPI.deleteCourse(id)
        if (response.data.success) {
          alert('Course deleted successfully!')
          fetchCourses()
        }
      } catch (error) {
        console.error('Error deleting course:', error)
        alert('Failed to delete course')
      }
    }
  }

  const resetNewCourseForm = () => {
    setNewCourse({
      selectedOption: '',
      name: '',
      description: '',
      instructor: '',
      instructorName: '',
      status: 'active',
      meetingLink: '',
      startTime: '',
      duration: 60,
      topic: '',
      meetingPlatform: 'google_meet'
    })
  }

  const filteredCourses = activeTab === 'all' 
    ? courses 
    : courses.filter(course => course.status === activeTab)

  const categories = ['All', 'Active', 'Inactive']

  // Format time for display
  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString)
      return format(date, 'hh:mm a')
    } catch (error) {
      return 'Invalid time'
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return format(date, 'dd MMM yyyy')
    } catch (error) {
      return 'Invalid date'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Courses / Classes</h1>
        <p className="text-gray-600 mt-2">
          Create, edit, and manage all classes and courses offered by the institute.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {courses.reduce((sum, course) => sum + (course.totalStudents || 0), 0)}
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <span className="text-2xl">👨‍🎓</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Upcoming Classes</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {upcomingClasses.length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <span className="text-2xl">📅</span>
            </div>
          </div>
        </div>
      </div>


       <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveTab(category.toLowerCase())}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === category.toLowerCase()
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center"
            >
              <span className="mr-2">➕</span>
              Add New Course & Schedule Class
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Classes Section - WITH DELETE BUTTONS ✅ */}
      {upcomingClasses.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">📅 Upcoming Classes</h2>
            <button
              onClick={fetchUpcomingClasses}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              🔄 Refresh
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingClasses.slice(0, 4).map((classItem) => (
              <div key={classItem._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative">
                {/* ✅ DELETE BUTTON - Top Right Corner */}
                <button
                  onClick={() => handleDeleteClass(classItem._id)}
                  className="absolute top-3 right-3 text-red-500 hover:text-red-700 bg-white rounded-full p-1 shadow-sm hover:shadow-md"
                  title="Delete Class"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {classItem.className || classItem.subject}
                    </span>
                    <h4 className="font-bold text-gray-900 mt-1">{classItem.subject}</h4>
                    <p className="text-sm text-gray-600">{classItem.topic}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">👨‍🏫</span>
                    <span>{classItem.instructorName}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">⏰</span>
                    <span>
                      {formatDate(classItem.startTime)} • {formatTime(classItem.startTime)}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">⏱️</span>
                    <span>{classItem.duration} minutes</span>
                  </div>
                  {classItem.meetingLink && (
                    <div className="pt-2">
                      <a 
                        href={classItem.meetingLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                      >
                        🔗 Join Live Class
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
     

      {/* Courses Table */}
      <div className="card">
  {loading ? (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      <p className="text-gray-600 mt-4">Loading courses...</p>
    </div>
  ) : (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course/Class</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCourses.map((course) => (
              <tr key={course._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                      <span className="text-blue-600">
                        {course.classType === 'course' ? '🎓' : '📚'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{course.name}</div>
                      {course.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {course.description}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                    {course.category}
                  </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium">{course.totalStudents || 0}</div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium">{course.instructor || 'Not assigned'}</div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      course.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {course.status?.charAt(0).toUpperCase() +
                      course.status?.slice(1) || 'Active'}
                  </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedCourse(course)
                        setNewCourse({
                          selectedOption: '',
                          name: course.name,
                          description: course.description || '',
                          instructor: course.instructor || '',
                          instructorName: course.instructor || '',
                          status: course.status || 'active'
                        })
                        setShowEditModal(true)
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDeleteCourse(course._id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">1</span> to{' '}
          <span className="font-medium">{filteredCourses.length}</span> of{' '}
          <span className="font-medium">{courses.length}</span> courses
        </div>
      </div>
    </>
  )}
</div>

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add New Course & Schedule Class</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    resetNewCourseForm()
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Classes and Courses Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Class or Course *
                  </label>
                  <select
                    value={newCourse.selectedOption}
                    onChange={(e) => {
                      const selectedOption = availableOptions.find(opt => opt.id === e.target.value)
                      setNewCourse({
                        ...newCourse,
                        selectedOption: e.target.value,
                        name: selectedOption ? selectedOption.name : '',
                        topic: '' // Always empty when selecting
                      })
                    }}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Class or Course</option>
                    
                    {/* Classes Section */}
                    <optgroup label="📚 Classes">
                      {availableOptions
                        .filter(opt => opt.type === 'class')
                        .map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                    </optgroup>
                    
                    {/* Courses Section */}
                    <optgroup label="🎓 Courses">
                      {availableOptions
                        .filter(opt => opt.type === 'course')
                        .map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>

                {/* Class Topic - FIXED ✅ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Topic *
                  </label>
                  <input
                    type="text"
                    value={newCourse.topic}
                    onChange={(e) => setNewCourse({...newCourse, topic: e.target.value})}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Calculus - Sets and Functions, Algebra Basics, Physics - Motion, etc."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter specific topic for this class. This will be shown to students.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Instructor Name (Select Option) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instructor Name *
                    </label>
                    <select
                      value={newCourse.instructorName}
                      onChange={(e) => setNewCourse({...newCourse, instructorName: e.target.value})}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Instructor</option>
                      {instructorOptions.map((instructor) => (
                        <option key={instructor.id} value={instructor.name}>
                          {instructor.name}
                        </option>
                      ))}
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Start Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Class Start Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={newCourse.startTime}
                      onChange={(e) => setNewCourse({...newCourse, startTime: e.target.value})}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration *
                    </label>
                    <select
                      value={newCourse.duration}
                      onChange={(e) => setNewCourse({...newCourse, duration: parseInt(e.target.value)})}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {durationOptions.map((duration) => (
                        <option key={duration.value} value={duration.value}>
                          {duration.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Meeting Platform */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meeting Platform *
                    </label>
                    <select
                      value={newCourse.meetingPlatform}
                      onChange={(e) => setNewCourse({...newCourse, meetingPlatform: e.target.value})}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="google_meet">Google Meet</option>
                      <option value="zoom">Zoom</option>
                      <option value="microsoft_teams">Microsoft Teams</option>
                    </select>
                  </div>
                </div>

                {/* Live Meeting Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Live Meeting Link *
                  </label>
                  <div className="flex items-center">
                    <span className="mr-2 text-gray-500">🔗</span>
                    <input
                      type="url"
                      value={newCourse.meetingLink}
                      onChange={(e) => setNewCourse({...newCourse, meetingLink: e.target.value})}
                      required
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Students will use this link to join the live class
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                    rows={4}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter course/class description, learning objectives, etc."
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={newCourse.status}
                    onChange={(e) => setNewCourse({...newCourse, status: e.target.value})}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Important Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <span className="text-blue-600 mr-2">💡</span>
                    <div>
                      <p className="text-sm text-blue-800 font-medium">Important Note</p>
                      <p className="text-xs text-blue-600 mt-1">
                        When you click "Add Course", a new course will be created and a class will be scheduled automatically. 
                        The class will appear in the "Upcoming Classes" section above with the live meeting link.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      resetNewCourseForm()
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCourse}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Scheduling...
                      </>
                    ) : (
                      'Schedule Class'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Course</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={newCourse.name}
                      onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instructor *
                    </label>
                    <select
                      value={newCourse.instructorName}
                      onChange={(e) => setNewCourse({...newCourse, instructorName: e.target.value})}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Instructor</option>
                      {instructorOptions.map((instructor) => (
                        <option key={instructor.id} value={instructor.name}>
                          {instructor.name}
                        </option>
                      ))}
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={newCourse.status}
                    onChange={(e) => setNewCourse({...newCourse, status: e.target.value})}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleEditCourse}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Course'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageCourses