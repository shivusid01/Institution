// src/pages/Courses.jsx
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { courseAPI } from '../services/api'

const Courses = () => {
  const [dbCourses, setDbCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const baseUrl = apiURL.replace('/api', '');
    return `${baseUrl}${imagePath}`;
  };

  // Fetch courses from backend
  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setIsLoading(true)
      const response = await courseAPI.getAllCourses()
      if (response.data.success) {
        // Filter out classes and keep only public courses catalog
        const allCourses = response.data.courses || []
        const publicCourses = allCourses.filter(c => c.classType === 'course')
        setDbCourses(publicCourses)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter courses based on active category
  useEffect(() => {
    let filtered = dbCourses
    
    if (activeCategory === 'hindi') {
      filtered = dbCourses.filter(course => course.language === 'Hindi')
    } else if (activeCategory === 'english') {
      filtered = dbCourses.filter(course => course.language === 'English')
    } else if (activeCategory === 'commerce') {
      filtered = dbCourses.filter(course => course.category?.toLowerCase() === 'commerce')
    } else if (activeCategory === 'competition') {
      filtered = dbCourses.filter(course => course.category?.toLowerCase() === 'competition' || course.category?.toLowerCase() === 'competitive exams')
    } else if (activeCategory === 'school') {
      filtered = dbCourses.filter(course => course.category?.toLowerCase() === 'school level' || course.category?.toLowerCase() === 'school')
    }
    
    setFilteredCourses(filtered)
  }, [activeCategory, dbCourses])

  const categories = [
    { name: 'All Courses', count: dbCourses.length, value: 'all' },
    { name: 'Hindi Medium', count: dbCourses.filter(c => c.language === 'Hindi').length, value: 'hindi' },
    { name: 'English Medium', count: dbCourses.filter(c => c.language === 'English').length, value: 'english' },
    { name: 'Commerce', count: dbCourses.filter(c => c.category?.toLowerCase() === 'commerce').length, value: 'commerce' },
    { name: 'Competition', count: dbCourses.filter(c => c.category?.toLowerCase() === 'competition' || c.category?.toLowerCase() === 'competitive exams').length, value: 'competition' },
    { name: 'School Level', count: dbCourses.filter(c => c.category?.toLowerCase() === 'school level' || c.category?.toLowerCase() === 'school').length, value: 'school' }
  ]

  // Group courses by name for side-by-side display when showing all
  const groupedCourses = React.useMemo(() => {
    if (activeCategory === 'all') {
      const groups = {}
      dbCourses.forEach(course => {
        const baseTitle = course.name
        if (!groups[baseTitle]) {
          groups[baseTitle] = { hindi: null, english: null }
        }
        if (course.language === 'Hindi') {
          groups[baseTitle].hindi = course
        } else {
          groups[baseTitle].english = course
        }
      })
      return Object.entries(groups)
    }
    return null
  }, [activeCategory, dbCourses])

  const getCourseIcon = (course) => {
    if (course.icon) return course.icon;
    const name = course.name.toLowerCase();
    const category = course.category?.toLowerCase() || '';
    if (name.includes('school') || name.includes('academic') || category.includes('school')) return '📚';
    if (name.includes('foundation')) return '🔬';
    if (name.includes('commerce') || category.includes('commerce')) return '📊';
    if (name.includes('competition') || category.includes('competition')) return '🏆';
    if (name.includes('b.com')) return '🎓';
    if (name.includes('m.com')) return '📈';
    return '📚';
  };

  const getCourseColor = () => {
    return 'bg-gradient-to-br from-blue-50 to-white';
  };

  // Course Card Component
  const CourseCard = ({ course }) => (
    <div
      className={`${getCourseColor(course)} rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 relative h-full border border-gray-100 hover:border-red-300 group flex flex-col`}
    >
      {/* Language Badge */}
      <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200 shadow-sm">
        {course.language}
      </div>
      
      {/* Popular Tag */}
      {course.tag && (
        <div 
          className="absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-900 text-white shadow-lg"
        >
          {course.tag}
        </div>
      )}
      
      <div className="p-6 pt-12 h-full flex flex-col flex-1">
        {/* Course Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-3xl mb-2">
              {getCourseIcon(course)}
            </div>
            <h3 className="text-xl font-bold text-gray-900 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-900 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
              {course.name}
            </h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent">
              {course.fee || 'Free'}
            </div>
            <div className="text-sm text-gray-600">
              {course.fee && (course.fee.includes('/year') ? 'per year' : course.fee.includes('-') ? 'range' : 'full course')}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-700 mb-6 flex-grow">{course.description}</p>

        {/* Subjects */}
        {course.subjects && course.subjects.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Subjects Covered:</h4>
            <div className="flex flex-wrap gap-2">
              {course.subjects.map((subject, index) => (
                <span 
                  key={index} 
                  className="px-3 py-1 bg-white rounded-full text-sm shadow-sm border border-gray-200"
                >
                  {subject}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        {course.features && course.features.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Key Features:</h4>
            <ul className="space-y-1">
              {course.features.map((feature, index) => (
                <li 
                  key={index} 
                  className="flex items-center text-sm text-gray-700"
                >
                  <span className="mr-2 text-blue-500">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Duration & CTA */}
        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-sm text-gray-600">Duration:</span>
              <span className="ml-2 font-medium text-gray-900">{course.duration || 'Flexible'}</span>
            </div>
            <div className="flex gap-2">
              {course.syllabusUrl && (
                <a 
                  href={getImageUrl(course.syllabusUrl)}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-1 transition-all"
                  title="Download Syllabus PDF"
                >
                  📥 Syllabus
                </a>
              )}
              <Link 
                to="/signup" 
                className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-900 text-white px-5 py-2 rounded-lg font-medium transition-all duration-300 group hover:shadow-lg hover:shadow-blue-200"
              >
                <span className="relative z-10">Enroll Now</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-blue-600" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Loading Animation
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-6 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-900 rounded-full"></div>
            </div>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent">
            Loading Sharma Institute...
          </h2>
          <p className="text-gray-600 mt-4">Preparing your academic journey</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 bg-gradient-to-b from-white to-blue-50 fade-in">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-blue-600 to-blue-900 bg-clip-text text-transparent">
          Explore Our Courses
        </h1>
        <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
          Choose from a wide range of courses in both Hindi and English medium, designed by experts to help you achieve your academic goals.
        </p>
        
        {/* Language Indicators */}
        <div className="mt-8 flex flex-wrap justify-center gap-6">
          <div className="flex items-center bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 rounded-lg border border-blue-200 shadow-sm">
            <div className="w-3 h-3 bg-red-600 rounded-full mr-2" />
            <span className="text-gray-800 font-medium">Hindi Medium - Lower Fees</span>
          </div>
          <div className="flex items-center bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 rounded-lg border border-blue-200 shadow-sm">
            <div className="w-3 h-3 bg-blue-700 rounded-full mr-2" />
            <span className="text-gray-800 font-medium">English Medium</span>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Categories</h2>
        <div className="flex flex-wrap gap-3">
          {categories.map((category, index) => (
            <button
              key={index}
              onClick={() => setActiveCategory(category.value)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeCategory === category.value
                  ? 'bg-gradient-to-r from-blue-600 to-blue-900 text-white shadow-lg shadow-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
            >
              {category.name}
              <span className={`ml-2 text-sm ${activeCategory === category.value ? 'opacity-90' : 'opacity-75'}`}>
                ({category.count})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredCourses.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100 mb-12">
          <span className="text-5xl block mb-4">🎓</span>
          <h3 className="text-xl font-bold text-gray-800">No Courses Available</h3>
          <p className="text-gray-500 mt-2">There are currently no courses in this category. Check back later!</p>
        </div>
      )}

      {/* Course Grid */}
      {activeCategory === 'all' ? (
        <div key="all-courses" className="space-y-12 mb-12">
          {groupedCourses.map(([title, { hindi, english }]) => (
            <div key={title} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {hindi && (
                  <div className="relative h-full">
                    <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 px-3 py-1 rounded-lg font-medium text-sm z-10 shadow-md border border-blue-200">
                      Hindi
                    </div>
                    <CourseCard course={hindi} />
                  </div>
                )}
                
                {english && (
                  <div className="relative h-full">
                    <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 px-3 py-1 rounded-lg font-medium text-sm z-10 shadow-md border border-blue-200">
                      English
                    </div>
                    <CourseCard course={english} />
                  </div>
                )}
              </div>

              {/* Price Comparison */}
              {hindi && english && (
                <div className="bg-gradient-to-r from-blue-50 to-blue-50 rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-2">
                    <span className="font-medium text-gray-900">{title} - Medium Comparison</span>
                    <div className="bg-gradient-to-r from-blue-600 to-blue-900 text-white px-4 py-1 rounded-lg font-medium shadow-md">
                      Hindi Medium is Lower Fee
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1 text-sm">
                        <span className="text-red-600 font-medium">Hindi Medium: {hindi.fee}</span>
                        <span className="text-blue-600 font-medium">English Medium: {english.fee}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-900 h-2 rounded-full w-2/3" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div key="filtered-courses" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredCourses.map((course) => (
            <div key={course._id}>
              <CourseCard course={course} />
            </div>
          ))}
        </div>
      )}

      {/* FAQ Section */}
      <div className="bg-gradient-to-br from-white to-blue-50 border border-gray-200 rounded-2xl shadow-lg p-8 mb-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {[
            {
              q: 'What is the difference between Hindi and English medium courses?',
              a: 'Both courses cover the same syllabus and content. The only difference is the language of instruction. Hindi medium courses have lower fees to make quality education more accessible.'
            },
            {
              q: 'Can I switch between Hindi and English medium during the course?',
              a: 'Yes, you can request a language switch within the first month of enrollment. Contact our support team for assistance.'
            },
            {
              q: 'Are study materials available in both languages?',
              a: 'Yes! All study materials are available in both Hindi and English for their respective courses.'
            },
            {
              q: 'Is there a demo class available?',
              a: 'Absolutely! We offer free demo classes for all courses. Contact us to schedule your demo.'
            }
          ].map((faq, index) => (
            <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                <span className="mr-2">Q.</span>
                {faq.q}
              </h3>
              <p className="text-gray-700 ml-6">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative rounded-2xl p-8 md:p-12 text-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-600 to-blue-900" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-white/10 to-blue-900/0" />
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="mb-6 text-blue-100 max-w-2xl mx-auto">
            Join thousands of successful students who transformed their education with our expert guidance.
          </p>
          <div>
            <Link to="/signup" className="relative inline-flex items-center gap-2 bg-white text-blue-600 hover:text-blue-900 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 overflow-hidden group hover:scale-105 hover:shadow-2xl">
              <span className="relative z-10">Enroll Now</span>
              <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Rating Badge */}
      <div className="fixed bottom-8 left-8 z-50">
        <div className="bg-white rounded-full p-4 shadow-2xl border border-blue-200 hover:border-blue-600 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className="text-2xl">⭐</div>
            <div className="text-right">
              <div className="font-bold bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent">
                Rated 4.9/5
              </div>
              <div className="text-sm text-gray-600">by 2000+ students</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Courses