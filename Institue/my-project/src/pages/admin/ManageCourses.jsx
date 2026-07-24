// src/pages/admin/ManageCourses.jsx
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { courseAPI, classAPI } from '../../services/api'
import { format } from 'date-fns'

const ManageCourses = () => {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('classes') // 'classes' or 'catalog'
  const [activeFilter, setActiveFilter] = useState('all') // 'all', 'active', 'inactive'
  
  // Modals
  const [showAddClassModal, setShowAddClassModal] = useState(false)
  const [showEditClassModal, setShowEditClassModal] = useState(false)
  const [showAddCatalogModal, setShowAddCatalogModal] = useState(false)
  const [showEditCatalogModal, setShowEditCatalogModal] = useState(false)
  
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedClass, setSelectedClass] = useState(null)
  const [loading, setLoading] = useState(false)
  
  // Data lists
  const [courses, setCourses] = useState([])
  const [upcomingClasses, setUpcomingClasses] = useState([])

  // Syllabus PDF upload states
  const [syllabusFile, setSyllabusFile] = useState(null)
  const [uploadingSyllabus, setUploadingSyllabus] = useState(false)

  // Options
  const availableOptions = courses
    .filter(course => course.classType === 'course' && course.status === 'active')
    .map(course => ({
      id: course.name,
      name: course.name,
      type: 'course',
      category: course.category
    }));


  const instructorOptions = [
    { id: 1, name: "Mr. Jeetlal Sharma" },
    { id: 2, name: "Ashok Sharma" },
    { id: 3, name: "Chandra Bhushan Kumar" },
    { id: 4, name: "Meenu sharma" },
  ];

  const durationOptions = [
    { value: 30, label: "30 minutes" },
    { value: 45, label: "45 minutes" },
    { value: 60, label: "60 minutes" },
    { value: 90, label: "90 minutes" },
    { value: 120, label: "120 minutes" },
  ];

  // Forms states
  const [classForm, setClassForm] = useState({
    selectedOption: '',
    topic: '',
    instructorName: '',
    startTime: '',
    duration: 60,
    meetingLink: '',
    meetingPlatform: 'google_meet',
    description: ''
  });

  const [catalogForm, setCatalogForm] = useState({
    name: '',
    description: '',
    category: 'School Level',
    fee: '',
    duration: '',
    language: 'Hindi',
    tag: '',
    subjects: '',
    features: '',
    instructor: 'Mr. Jeetlal Sharma',
    status: 'active',
    syllabusUrl: ''
  });

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

  // Handle Class Addition (existing flow)
  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!classForm.selectedOption || !classForm.topic || !classForm.startTime || !classForm.meetingLink) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const selectedOption = availableOptions.find(opt => opt.id === classForm.selectedOption);
      const name = selectedOption ? selectedOption.name : classForm.selectedOption;
      const category = selectedOption ? selectedOption.category : 'General';

      // 1. Create course entry (with backend check to retrieve existing instead of error)
      await courseAPI.createCourse({
        name,
        category,
        instructor: classForm.instructorName,
        description: classForm.description || `Class for ${name}`,
        status: 'active',
        classType: 'live_class'
      });

      // 2. Create the Class schedule
      const classData = {
        title: name,
        description: classForm.description || `Class for ${name}`,
        category,
        subject: name,
        topic: classForm.topic.trim(),
        startTime: classForm.startTime,
        duration: classForm.duration,
        meetingLink: classForm.meetingLink,
        meetingPlatform: classForm.meetingPlatform,
        instructorName: classForm.instructorName,
        instructorId: currentUser?._id,
        targetAudience: ['all'],
        visibility: 'all_students'
      };

      const response = await classAPI.createClass(classData);
      if (response.data.success) {
        alert('✅ Class scheduled successfully!');
        setShowAddClassModal(false);
        resetClassForm();
        await Promise.all([fetchCourses(), fetchUpcomingClasses()]);
      }
    } catch (error) {
      console.error('Error scheduling class:', error);
      alert(error.response?.data?.message || 'Failed to schedule class.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    try {
      await classAPI.deleteClass(classId);
      alert('✅ Class deleted successfully!');
      fetchUpcomingClasses();
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('Failed to delete class.');
    }
  };

  // Syllabus PDF upload helper
  const handleUploadSyllabusFile = async (file) => {
    try {
      setUploadingSyllabus(true)
      const data = new FormData()
      data.append('syllabus', file)
      const res = await courseAPI.uploadSyllabus(data)
      if (res.data.success) {
        return res.data.fileUrl
      }
    } catch (error) {
      console.error('Syllabus upload error:', error)
      alert('Failed to upload syllabus PDF. Ensure it is a valid PDF under 10MB.')
    } finally {
      setUploadingSyllabus(false)
    }
    return '';
  }

  // Handle Catalog Course Addition (New Flow)
  const handleAddCatalogCourse = async (e) => {
    e.preventDefault();
    if (!catalogForm.name || !catalogForm.fee || !catalogForm.duration) {
      alert('Please fill in required fields: Title, Fee, and Duration');
      return;
    }

    try {
      setLoading(true);
      let uploadedUrl = '';
      if (syllabusFile) {
        uploadedUrl = await handleUploadSyllabusFile(syllabusFile);
        if (!uploadedUrl) {
          setLoading(false);
          return;
        }
      }

      const subjectsArray = catalogForm.subjects.split(',').map(s => s.trim()).filter(Boolean);
      const featuresArray = catalogForm.features.split(',').map(f => f.trim()).filter(Boolean);

      const courseData = {
        name: catalogForm.name,
        description: catalogForm.description,
        category: catalogForm.category,
        fee: catalogForm.fee,
        duration: catalogForm.duration,
        language: catalogForm.language,
        tag: catalogForm.tag,
        subjects: subjectsArray,
        features: featuresArray,
        instructor: catalogForm.instructor,
        status: catalogForm.status,
        classType: 'course',
        syllabusUrl: uploadedUrl
      };

      const response = await courseAPI.createCourse(courseData);
      if (response.data.success) {
        alert('✅ Course added to catalog successfully!');
        setShowAddCatalogModal(false);
        resetCatalogForm();
        fetchCourses();
      }
    } catch (error) {
      console.error('Error adding course to catalog:', error);
      alert(error.response?.data?.message || 'Failed to add course.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Catalog Course Update
  const handleEditCatalogCourse = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      let uploadedUrl = catalogForm.syllabusUrl;
      
      if (syllabusFile) {
        uploadedUrl = await handleUploadSyllabusFile(syllabusFile);
        if (!uploadedUrl) {
          setLoading(false);
          return;
        }
      }

      const subjectsArray = typeof catalogForm.subjects === 'string'
        ? catalogForm.subjects.split(',').map(s => s.trim()).filter(Boolean)
        : catalogForm.subjects;

      const featuresArray = typeof catalogForm.features === 'string'
        ? catalogForm.features.split(',').map(f => f.trim()).filter(Boolean)
        : catalogForm.features;

      const courseData = {
        name: catalogForm.name,
        description: catalogForm.description,
        category: catalogForm.category,
        fee: catalogForm.fee,
        duration: catalogForm.duration,
        language: catalogForm.language,
        tag: catalogForm.tag,
        subjects: subjectsArray,
        features: featuresArray,
        instructor: catalogForm.instructor,
        status: catalogForm.status,
        syllabusUrl: uploadedUrl
      };

      const response = await courseAPI.updateCourse(selectedCourse._id, courseData);
      if (response.data.success) {
        alert('✅ Course updated successfully!');
        setShowEditCatalogModal(false);
        resetCatalogForm();
        fetchCourses();
      }
    } catch (error) {
      console.error('Error updating catalog course:', error);
      alert(error.response?.data?.message || 'Failed to update course.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course from the catalog?')) return;
    try {
      const response = await courseAPI.deleteCourse(id);
      if (response.data.success) {
        alert('✅ Course deleted successfully!');
        fetchCourses();
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      alert(error.response?.data?.message || 'Failed to delete course.');
    }
  };

  const resetClassForm = () => {
    setClassForm({
      selectedOption: '',
      topic: '',
      instructorName: '',
      startTime: '',
      duration: 60,
      meetingLink: '',
      meetingPlatform: 'google_meet',
      description: ''
    });
  };

  const resetCatalogForm = () => {
    setCatalogForm({
      name: '',
      description: '',
      category: 'School Level',
      fee: '',
      duration: '',
      language: 'Hindi',
      tag: '',
      subjects: '',
      features: '',
      instructor: 'Mr. Jeetlal Sharma',
      status: 'active',
      syllabusUrl: ''
    });
    setSyllabusFile(null);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const baseUrl = apiURL.replace('/api', '');
    return `${baseUrl}${imagePath}`;
  };

  // Filter lists based on tab and status
  const catalogCourses = courses.filter(course => course.classType === 'course');
  const filteredCatalog = activeFilter === 'all'
    ? catalogCourses
    : catalogCourses.filter(course => course.status === activeFilter);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Classes & Course Catalog</h1>
        <p className="text-gray-600 mt-2">
          Schedule online classes for students or manage the public course catalog with syllabus PDF downloads.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab('classes')}
          className={`py-3 px-6 font-semibold text-lg border-b-2 transition-all ${
            activeTab === 'classes'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📅 Live Classes Schedule
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`py-3 px-6 font-semibold text-lg border-b-2 transition-all ${
            activeTab === 'catalog'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          🎓 Public Course Catalog
        </button>
      </div>

      {/* ========================================================
          TAB 1: LIVE CLASSES SCHEDULE
          ======================================================== */}
      {activeTab === 'classes' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Live Scheduled Sessions</h2>
              <p className="text-sm text-gray-500 mt-1">
                Currently scheduled live classes on Google Meet / Zoom.
              </p>
            </div>
            <button
              onClick={() => setShowAddClassModal(true)}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
            >
              <span>➕</span> Schedule Live Class
            </button>
          </div>

          {upcomingClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingClasses.map((classItem) => (
                <div key={classItem._id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow relative">
                  <button
                    onClick={() => handleDeleteClass(classItem._id)}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-700 p-1 bg-gray-50 hover:bg-red-50 rounded-full transition-colors"
                    title="Cancel/Delete Class"
                  >
                    🗑️
                  </button>

                  <div className="mb-4">
                    <span className="inline-block text-xs font-semibold text-blue-800 bg-blue-100 px-2.5 py-1 rounded">
                      {classItem.className || classItem.subject}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 mt-2">{classItem.subject}</h3>
                    <p className="text-sm text-gray-600">{classItem.topic}</p>
                  </div>

                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <span>👨‍🏫</span>
                      <span>Instructor: <strong>{classItem.instructorName}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>⏰</span>
                      <span>
                        {format(new Date(classItem.startTime), 'dd MMM yyyy')} • {format(new Date(classItem.startTime), 'hh:mm a')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>⏱️</span>
                      <span>Duration: {classItem.duration} mins</span>
                    </div>
                  </div>

                  {classItem.meetingLink && (
                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                        Platform: {classItem.meetingPlatform?.replace('_', ' ')}
                      </span>
                      <a
                        href={classItem.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center gap-1"
                      >
                        🔗 Join Meeting Link
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <span className="text-4xl block mb-2">📅</span>
              <p className="text-gray-500">No live classes scheduled currently.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: PUBLIC COURSE CATALOG
          ======================================================== */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Public Courses Catalog</h2>
              <p className="text-sm text-gray-500 mt-1">
                Add, edit, or remove courses appearing on the public "Explore Our Courses" page.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {['all', 'active', 'inactive'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                      activeFilter === filter
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowAddCatalogModal(true)}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
              >
                <span>➕</span> Add Course to Catalog
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Course Details</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Medium / Fee</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Syllabus PDF</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredCatalog.map((course) => (
                  <tr key={course._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{course.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Category: {course.category}</div>
                      {course.tag && (
                        <span className="inline-block text-[10px] bg-red-100 text-blue-800 font-bold px-2 py-0.5 rounded mt-1">
                          {course.tag}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold">{course.language} Medium</div>
                      <div className="text-sm text-green-600 font-bold mt-0.5">{course.fee}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                      {course.duration}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {course.syllabusUrl ? (
                        <a
                          href={getImageUrl(course.syllabusUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                        >
                          📄 Download PDF
                        </a>
                      ) : (
                        <span className="text-gray-400">Not Uploaded</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        course.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-blue-800'
                      }`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setSelectedCourse(course);
                            setCatalogForm({
                              name: course.name,
                              description: course.description || '',
                              category: course.category || 'School Level',
                              fee: course.fee || '',
                              duration: course.duration || '',
                              language: course.language || 'Hindi',
                              tag: course.tag || '',
                              subjects: course.subjects ? course.subjects.join(', ') : '',
                              features: course.features ? course.features.join(', ') : '',
                              instructor: course.instructor || 'Mr. Jeetlal Sharma',
                              status: course.status || 'active',
                              syllabusUrl: course.syllabusUrl || ''
                            });
                            setShowEditCatalogModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course._id)}
                          className="text-red-500 hover:text-red-700 font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredCatalog.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-gray-500">
                      No courses found in catalog. Seeding will run if database is empty.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD LIVE CLASS SCHEDULE
          ======================================================== */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto">
            <form onSubmit={handleAddClass} className="p-6 space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-900">Schedule a Live Online Class</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddClassModal(false)
                    resetClassForm()
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Class/Course Standard *
                  </label>
                  <select
                    value={classForm.selectedOption}
                    onChange={(e) => setClassForm({ ...classForm, selectedOption: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Class Standard</option>
                    {availableOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name} ({opt.category})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class Topic / Chapter Title *
                  </label>
                  <input
                    type="text"
                    value={classForm.topic}
                    onChange={(e) => setClassForm({ ...classForm, topic: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Chapter 1: Real Numbers"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instructor Name *
                    </label>
                    <select
                      value={classForm.instructorName}
                      onChange={(e) => setClassForm({ ...classForm, instructorName: e.target.value })}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                    >
                      <option value="">Select Instructor</option>
                      {instructorOptions.map(inst => (
                        <option key={inst.id} value={inst.name}>{inst.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={classForm.startTime}
                      onChange={(e) => setClassForm({ ...classForm, startTime: e.target.value })}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration *
                    </label>
                    <select
                      value={classForm.duration}
                      onChange={(e) => setClassForm({ ...classForm, duration: parseInt(e.target.value) })}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                    >
                      {durationOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Platform *
                    </label>
                    <select
                      value={classForm.meetingPlatform}
                      onChange={(e) => setClassForm({ ...classForm, meetingPlatform: e.target.value })}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                    >
                      <option value="google_meet">Google Meet</option>
                      <option value="zoom">Zoom</option>
                      <option value="microsoft_teams">Microsoft Teams</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Link URL *
                  </label>
                  <input
                    type="url"
                    value={classForm.meetingLink}
                    onChange={(e) => setClassForm({ ...classForm, meetingLink: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Extra Instructions / Notes
                  </label>
                  <textarea
                    value={classForm.description}
                    onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                    placeholder="Enter details like homework review, books to keep ready..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddClassModal(false)
                    resetClassForm()
                  }}
                  className="px-5 py-2 border rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Scheduling...' : 'Schedule Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD COURSE TO CATALOG (WITH PDF UPLOAD)
          ======================================================== */}
      {showAddCatalogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto">
            <form onSubmit={handleAddCatalogCourse} className="p-6 space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-900">Add Course to Public Catalog</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCatalogModal(false)
                    resetCatalogForm()
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      value={catalogForm.name}
                      onChange={(e) => setCatalogForm({ ...catalogForm, name: e.target.value })}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                      placeholder="e.g. CBSE 11-12 (Commerce)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={catalogForm.category}
                      onChange={(e) => setCatalogForm({ ...catalogForm, category: e.target.value })}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                    >
                      <option value="School Level">School Level</option>
                      <option value="Commerce">Commerce</option>
                      <option value="Competition">Competition</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language Medium *
                    </label>
                    <select
                      value={catalogForm.language}
                      onChange={(e) => setCatalogForm({ ...catalogForm, language: e.target.value })}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                    >
                      <option value="Hindi">Hindi Medium</option>
                      <option value="English">English Medium</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fee structure *
                    </label>
                    <input
                      type="text"
                      value={catalogForm.fee}
                      onChange={(e) => setCatalogForm({ ...catalogForm, fee: e.target.value })}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                      placeholder="e.g. ₹2,500 - 7,500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration *
                    </label>
                    <input
                      type="text"
                      value={catalogForm.duration}
                      onChange={(e) => setCatalogForm({ ...catalogForm, duration: e.target.value })}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                      placeholder="e.g. 1 Year"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tag / Badge
                    </label>
                    <input
                      type="text"
                      value={catalogForm.tag}
                      onChange={(e) => setCatalogForm({ ...catalogForm, tag: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                      placeholder="e.g. Most Popular"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instructor Name
                    </label>
                    <select
                      value={catalogForm.instructor}
                      onChange={(e) => setCatalogForm({ ...catalogForm, instructor: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                    >
                      {instructorOptions.map(inst => (
                        <option key={inst.id} value={inst.name}>{inst.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subjects Covered (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={catalogForm.subjects}
                    onChange={(e) => setCatalogForm({ ...catalogForm, subjects: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                    placeholder="e.g. Accounts, Economics, English"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key Features (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={catalogForm.features}
                    onChange={(e) => setCatalogForm({ ...catalogForm, features: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                    placeholder="e.g. Daily Live Classes, Study Material, Mock Tests"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Syllabus / Brochure PDF File
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setSyllabusFile(e.target.files[0])}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Select a PDF detailing the course outline. Maximum size: 10MB.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={catalogForm.description}
                    onChange={(e) => setCatalogForm({ ...catalogForm, description: e.target.value })}
                    required
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                    placeholder="Brief description of the course..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCatalogModal(false)
                    resetCatalogForm()
                  }}
                  className="px-5 py-2 border rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingSyllabus}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Saving...' : uploadingSyllabus ? 'Uploading PDF...' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDIT COURSE CATALOG (WITH PDF UPLOAD)
          ======================================================== */}
      {showEditCatalogModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto">
            <form onSubmit={handleEditCatalogCourse} className="p-6 space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-900">Edit Catalog Course</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditCatalogModal(false)
                    resetCatalogForm()
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      value={catalogForm.name}
                      onChange={(e) => setCatalogForm({ ...catalogForm, name: e.target.value })}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={catalogForm.category}
                      onChange={(e) => setCatalogForm({ ...catalogForm, category: e.target.value })}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                    >
                      <option value="School Level">School Level</option>
                      <option value="Commerce">Commerce</option>
                      <option value="Competition">Competition</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language Medium *
                    </label>
                    <select
                      value={catalogForm.language}
                      onChange={(e) => setCatalogForm({ ...catalogForm, language: e.target.value })}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                    >
                      <option value="Hindi">Hindi Medium</option>
                      <option value="English">English Medium</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fee structure *
                    </label>
                    <input
                      type="text"
                      value={catalogForm.fee}
                      onChange={(e) => setCatalogForm({ ...catalogForm, fee: e.target.value })}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration *
                    </label>
                    <input
                      type="text"
                      value={catalogForm.duration}
                      onChange={(e) => setCatalogForm({ ...catalogForm, duration: e.target.value })}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tag / Badge
                    </label>
                    <input
                      type="text"
                      value={catalogForm.tag}
                      onChange={(e) => setCatalogForm({ ...catalogForm, tag: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instructor Name
                    </label>
                    <select
                      value={catalogForm.instructor}
                      onChange={(e) => setCatalogForm({ ...catalogForm, instructor: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                    >
                      {instructorOptions.map(inst => (
                        <option key={inst.id} value={inst.name}>{inst.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subjects Covered (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={catalogForm.subjects}
                    onChange={(e) => setCatalogForm({ ...catalogForm, subjects: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key Features (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={catalogForm.features}
                    onChange={(e) => setCatalogForm({ ...catalogForm, features: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Replace Syllabus / Brochure PDF File
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setSyllabusFile(e.target.files[0])}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                  />
                  {catalogForm.syllabusUrl && (
                    <p className="text-xs text-green-600 mt-1">
                      Current PDF uploaded. Uploading a new file will replace it.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status *
                    </label>
                    <select
                      value={catalogForm.status}
                      onChange={(e) => setCatalogForm({ ...catalogForm, status: e.target.value })}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={catalogForm.description}
                    onChange={(e) => setCatalogForm({ ...catalogForm, description: e.target.value })}
                    required
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditCatalogModal(false)
                    resetCatalogForm()
                  }}
                  className="px-5 py-2 border rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingSyllabus}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Saving...' : uploadingSyllabus ? 'Uploading PDF...' : 'Update Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageCourses