// src/pages/Courses.jsx
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Courses = () => {
  // All courses data
  const allCourses = [
    // Academic Courses
    {
      id: 1,
      title: 'Academic (Class 1-8)',
      description: 'Master your academics with our end-to-end guidance and proven strategy.',
      duration: '1 Year',
      fee: '₹2,500 - 7,500',
      subjects: ['Hindi', 'English', 'Maths', 'Science', 'Social Science'],
      features: ['Daily Live Classes', 'Study Material', 'Mock Tests', 'Doubt Sessions'],
      color: 'bg-gradient-to-br from-red-50 to-white',
      icon: '📚',
      language: 'Hindi',
      category: ['school', 'hindi'],
      tag: 'Most Popular'
    },
    {
      id: 8,
      title: 'Academic (Class 1-8)',
      description: 'Master your academics with our end-to-end guidance and proven strategy.',
      duration: '1 Year',
      fee: '₹3,500 - 9,000',
      subjects: ['Hindi', 'English', 'Maths', 'Science', 'Social Science'],
      features: ['Daily Live Classes', 'Study Material', 'Mock Tests', 'Doubt Sessions'],
      color: 'bg-gradient-to-br from-purple-50 to-white',
      icon: '📚',
      language: 'English',
      category: ['school', 'english'],
      tag: 'Most Popular'
    },

    // Foundation Courses
    {
      id: 2,
      title: 'Foundation (Class 9-10)',
      description: 'Build strong fundamentals for future competitive exams.',
      duration: '2 Years',
      fee: '₹35,000/year',
      subjects: ['Maths', 'Science', 'English', 'Social Science'],
      features: ['Concept Building', 'Olympiad Prep', 'Activity Based', 'Regular Tests'],
      color: 'bg-gradient-to-br from-red-50 to-white',
      icon: '🔬',
      language: 'Hindi',
      category: ['school', 'hindi', 'foundation']
    },
    {
      id: 9,
      title: 'Foundation (Class 9-10)',
      description: 'Build strong fundamentals for future competitive exams.',
      duration: '2 Years',
      fee: '₹40,000/year',
      subjects: ['Maths', 'Science', 'English', 'Social Science'],
      features: ['Concept Building', 'Olympiad Prep', 'Activity Based', 'Regular Tests'],
      color: 'bg-gradient-to-br from-purple-50 to-white',
      icon: '🔬',
      language: 'English',
      category: ['school', 'english', 'foundation']
    },

    // CBSE Commerce
    {
      id: 3,
      title: 'CBSE 11-12 (Commerce)',
      description: 'Comprehensive board exam preparation with experienced faculty.',
      duration: '2 Years',
      fee: '₹10,000',
      subjects: ['Accounts', 'B. Studies', 'B. Maths', 'Economics'],
      features: ['Video Lectures', 'Practice Papers', 'Revision Tests', 'Personal Guidance'],
      color: 'bg-gradient-to-br from-red-50 to-white',
      icon: '📊',
      language: 'Hindi',
      category: ['commerce', 'hindi', 'cbse']
    },
    {
      id: 10,
      title: 'CBSE 11-12 (Commerce)',
      description: 'Comprehensive board exam preparation with experienced faculty.',
      duration: '2 Years',
      fee: '₹12,000',
      subjects: ['Accounts', 'B. Studies', 'B. Maths', 'Economics'],
      features: ['Video Lectures', 'Practice Papers', 'Revision Tests', 'Personal Guidance'],
      color: 'bg-gradient-to-br from-purple-50 to-white',
      icon: '📊',
      language: 'English',
      category: ['commerce', 'english', 'cbse']
    },

    // State Board Commerce
    {
      id: 4,
      title: 'State Board 11-12 (Commerce)',
      description: 'Complete board and competitive exam preparation for commerce students.',
      duration: '2 Years',
      fee: '₹10,000',
      subjects: ['Accounts', 'B. Studies', 'B. Maths', 'Economics'],
      features: ['Video Lectures', 'Practice Papers', 'Revision Tests', 'Personal Guidance'],
      color: 'bg-gradient-to-br from-red-50 to-white',
      icon: '🏛️',
      language: 'Hindi',
      category: ['commerce', 'hindi', 'state']
    },
    {
      id: 11,
      title: 'State Board 11-12 (Commerce)',
      description: 'Complete board and competitive exam preparation for commerce students.',
      duration: '2 Years',
      fee: '₹12,000',
      subjects: ['Accounts', 'B. Studies', 'B. Maths', 'Economics'],
      features: ['Video Lectures', 'Practice Papers', 'Revision Tests', 'Personal Guidance'],
      color: 'bg-gradient-to-br from-purple-50 to-white',
      icon: '🏛️',
      language: 'English',
      category: ['commerce', 'english', 'state']
    },

    // B.COM
    {
      id: 5,
      title: 'B.COM',
      description: 'Complete exam preparation for B.Com students.',
      duration: '4 Years',
      fee: '₹10,000/year',
      subjects: ['Accounts', 'Economics', 'EVS', 'English'],
      features: ['Board Focus', 'Competitive Edge', 'Revision Tests', 'Personal Guidance'],
      color: 'bg-gradient-to-br from-red-50 to-white',
      icon: '🎓',
      language: 'Hindi',
      category: ['commerce', 'hindi', 'graduation']
    },
    {
      id: 12,
      title: 'B.COM',
      description: 'Complete exam preparation for B.Com students.',
      duration: '4 Years',
      fee: '₹12,000/year',
      subjects: ['Accounts', 'Economics', 'EVS', 'English'],
      features: ['Board Focus', 'Competitive Edge', 'Revision Tests', 'Personal Guidance'],
      color: 'bg-gradient-to-br from-purple-50 to-white',
      icon: '🎓',
      language: 'English',
      category: ['commerce', 'english', 'graduation']
    },

    // M.COM
    {
      id: 6,
      title: 'M.COM',
      description: 'Complete exam preparation for M.Com students.',
      duration: '1 Year',
      fee: '₹12,000',
      subjects: ['Financial Accounting', 'B.Law', 'Economics', 'Cost Accounting'],
      features: ['Expert Faculty', 'Case Studies', 'Revision Modules', 'Test Series'],
      color: 'bg-gradient-to-br from-red-50 to-white',
      icon: '📈',
      language: 'Hindi',
      category: ['commerce', 'hindi', 'postgraduation']
    },
    {
      id: 13,
      title: 'M.COM',
      description: 'Complete exam preparation for M.Com students.',
      duration: '1 Year',
      fee: '₹15,000',
      subjects: ['Financial Accounting', 'B.Law', 'Economics', 'Cost Accounting'],
      features: ['Expert Faculty', 'Case Studies', 'Revision Modules', 'Test Series'],
      color: 'bg-gradient-to-br from-purple-50 to-white',
      icon: '📈',
      language: 'English',
      category: ['commerce', 'english', 'postgraduation']
    },

    // Competition Exams
    {
      id: 7,
      title: 'Competition Exams',
      description: 'Integrated program for one day exam preparation from basics.',
      duration: '1 Year',
      fee: '₹6,000/year',
      subjects: ['GS', 'Maths', 'Reasoning', 'Current Affairs', 'Counselling'],
      features: ['Current Affairs', 'Test Series', 'Answer Writing', 'Mentorship'],
      color: 'bg-gradient-to-br from-red-50 to-white',
      icon: '🏆',
      language: 'Hindi',
      category: ['competition', 'hindi']
    },
    {
      id: 14,
      title: 'Competition Exams',
      description: 'Integrated program for one day exam preparation from basics.',
      duration: '1 Year',
      fee: '₹7,000/year',
      subjects: ['GS', 'Maths', 'Reasoning', 'Current Affairs', 'Counselling'],
      features: ['Current Affairs', 'Test Series', 'Answer Writing', 'Mentorship'],
      color: 'bg-gradient-to-br from-purple-50 to-white',
      icon: '🏆',
      language: 'English',
      category: ['competition', 'english']
    }
  ]

  const categories = [
    { name: 'All Courses', count: '14', value: 'all' },
    { name: 'Hindi Medium', count: '7', value: 'hindi' },
    { name: 'English Medium', count: '7', value: 'english' },
    { name: 'Commerce', count: '8', value: 'commerce' },
    { name: 'Competition', count: '2', value: 'competition' },
    { name: 'School Level', count: '4', value: 'school' }
  ]

  const [activeCategory, setActiveCategory] = useState('all')
  const [filteredCourses, setFilteredCourses] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Filter courses based on active category
  useEffect(() => {
    setIsLoading(true)
    
    // Simulate loading delay for animation
    const timer = setTimeout(() => {
      let filtered = allCourses
      
      if (activeCategory === 'hindi') {
        filtered = allCourses.filter(course => course.language === 'Hindi')
      } else if (activeCategory === 'english') {
        filtered = allCourses.filter(course => course.language === 'English')
      } else if (activeCategory === 'commerce') {
        filtered = allCourses.filter(course => course.category.includes('commerce'))
      } else if (activeCategory === 'competition') {
        filtered = allCourses.filter(course => course.category.includes('competition'))
      } else if (activeCategory === 'school') {
        filtered = allCourses.filter(course => course.category.includes('school'))
      }
      
      setFilteredCourses(filtered)
      setIsLoading(false)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [activeCategory])

  // Group courses by title for side-by-side display when showing all
  const groupedCourses = React.useMemo(() => {
    if (activeCategory === 'all') {
      const groups = {}
      allCourses.forEach(course => {
        const baseTitle = course.title
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
  }, [activeCategory])

  // Course Card Component
  const CourseCard = ({ course }) => (
    <div
      className={`${course.color} rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 relative h-full border border-gray-100 hover:border-red-300 group`}
    >
      {/* Language Badge */}
      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium ${
        course.language === 'Hindi' 
          ? 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-200 shadow-sm' 
          : 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border border-purple-200 shadow-sm'
      }`}>
        {course.language}
      </div>
      
      {/* Popular Tag */}
      {course.tag && (
        <div 
          className="absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-red-600 to-purple-900 text-white shadow-lg"
        >
          {course.tag}
        </div>
      )}
      
      <div className="p-6 pt-12 h-full flex flex-col">
        {/* Course Header with Icon Animation */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div 
              className="text-3xl mb-2"
            >
              {course.icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 group-hover:bg-gradient-to-r group-hover:from-red-600 group-hover:to-purple-900 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
              {course.title}
            </h3>
          </div>
          <div 
            className="text-right"
          >
            <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-purple-900 bg-clip-text text-transparent">
              {course.fee}
            </div>
            <div className="text-sm text-gray-600">
              {course.fee.includes('/year') ? 'per year' : course.fee.includes('-') ? 'range' : 'full course'}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-700 mb-6 flex-grow-0">{course.description}</p>

        {/* Subjects */}
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

        {/* Features */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Key Features:</h4>
          <ul className="space-y-1">
            {course.features.map((feature, index) => (
              <li 
                key={index} 
                className="flex items-center text-sm text-gray-700"
              >
                <span 
                  className={`mr-2 ${course.language === 'Hindi' ? 'text-red-500' : 'text-purple-500'}`}
                >
                  ✓
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Duration & CTA */}
        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-600">Duration:</span>
              <span className="ml-2 font-medium text-gray-900">{course.duration}</span>
            </div>
            <Link 
              to="/signup" 
              className="relative overflow-hidden bg-gradient-to-r from-red-600 to-purple-900 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 group hover:shadow-lg hover:shadow-red-200"
            >
              <span 
                className="relative z-10"
              >
                Enroll Now
              </span>
              <div 
                className="absolute inset-0 bg-gradient-to-r from-purple-900 to-red-600"
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )

  // Loading Animation
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div
              className="w-20 h-20 border-4 border-red-200 border-t-red-600 rounded-full mx-auto mb-6"
            />
            <div
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-purple-900 rounded-full"></div>
            </div>
          </div>
          <h2 
            className="text-2xl font-bold bg-gradient-to-r from-red-600 to-purple-900 bg-clip-text text-transparent"
          >
            Loading Sharma Institute...
          </h2>
          <p 
            className="text-gray-600 mt-4"
          >
            Preparing your academic journey
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 bg-gradient-to-b from-white to-red-50 fade-in">
      {/* Hero Section with Animation */}
      <div 
        className="text-center mb-16"
      >
        <h1 
          className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-red-600 via-purple-600 to-purple-900 bg-clip-text text-transparent"
        >
          Explore Our Courses
        </h1>
        <p 
          className="text-xl text-gray-700 max-w-3xl mx-auto mb-8"
        >
          Choose from a wide range of courses in both Hindi and English medium, designed by experts to help you achieve your academic goals.
        </p>
        
        {/* Language Indicators */}
        <div 
          className="mt-8 flex flex-wrap justify-center gap-6"
        >
          <div className="flex items-center bg-gradient-to-r from-red-50 to-red-100 px-4 py-3 rounded-lg border border-red-200 shadow-sm">
            <div 
              className="w-3 h-3 bg-red-600 rounded-full mr-2"
            />
            <span className="text-gray-800 font-medium">Hindi Medium - Lower Fees</span>
          </div>
          <div className="flex items-center bg-gradient-to-r from-purple-50 to-purple-100 px-4 py-3 rounded-lg border border-purple-200 shadow-sm">
            <div 
              className="w-3 h-3 bg-purple-600 rounded-full mr-2"
            />
            <span className="text-gray-800 font-medium">English Medium</span>
          </div>
        </div>
      </div>

      {/* Categories with Animation */}
      <div 
        className="mb-12"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Categories</h2>
        <div className="flex flex-wrap gap-3">
          {categories.map((category, index) => (
            <button
              key={index}
              onClick={() => setActiveCategory(category.value)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeCategory === category.value
                  ? 'bg-gradient-to-r from-red-600 to-purple-900 text-white shadow-lg shadow-purple-200' 
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

      {/* Course Grid */}
      
        {activeCategory === 'all' ? (
          <div 
            key="all-courses"
            className="space-y-12 mb-12"
          >
            {groupedCourses.map(([title, { hindi, english }], index) => (
              <div 
                key={title}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {hindi && (
                    <div className="relative">
                      <div className={`absolute -left-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-red-100 to-red-50 text-red-800 px-3 py-1 rounded-lg font-medium text-sm z-10 shadow-md border border-red-200`}>
                        Hindi
                      </div>
                      <CourseCard course={hindi} />
                    </div>
                  )}
                  
                  {english && (
                    <div className="relative">
                      <div className={`absolute -right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 px-3 py-1 rounded-lg font-medium text-sm z-10 shadow-md border border-purple-200`}>
                        English
                      </div>
                      <CourseCard course={english} />
                    </div>
                  )}
                </div>

                {/* Price Comparison */}
                {hindi && english && (
                  <div 
                    className="bg-gradient-to-r from-red-50 to-purple-50 rounded-xl p-4 border border-gray-200 shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-2">
                      <span className="font-medium text-gray-900">{title} - Price Comparison</span>
                      <div className="bg-gradient-to-r from-red-600 to-purple-900 text-white px-4 py-1 rounded-lg font-medium shadow-md">
                        Save ₹{(() => {
                          const hindiPrice = parseFloat(hindi.fee.replace(/[^0-9.-]+/g,""));
                          const englishPrice = parseFloat(english.fee.replace(/[^0-9.-]+/g,""));
                          return englishPrice - hindiPrice;
                        })()}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-red-600 font-medium">Hindi: {hindi.fee}</span>
                          <span className="text-purple-600 font-medium">English: {english.fee}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-red-500 via-purple-600 to-purple-900 h-2 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div 
            key="filtered-courses"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
            layout
          >
            
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  layout
                >
                  <CourseCard course={course} />
                </div>
              ))}
            
          </div>
        )}

{/* FAQ with Animation */}
      <div 
        className="bg-gradient-to-br from-white to-red-50 border border-gray-200 rounded-2xl shadow-lg p-8 mb-20"
      >
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
            <div 
              key={index}
              className="border-b border-gray-200 pb-4 last:border-0"
            >
              <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                <span 
                  className="mr-2"
                >
                  Q.
                </span>
                {faq.q}
              </h3>
              <p className="text-gray-700 ml-6">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section with Animation */}
      <div 
        className="relative rounded-2xl p-8 md:p-12 text-center text-white overflow-hidden"
      >
        {/* Gradient Background with Animation */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-red-600 via-purple-600 to-purple-900"
        />
        
        {/* Animated Overlay */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-white/10 to-purple-900/0"
        />
        
        {/* Floating Particles */}
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
        
        <div className="relative z-10">
          <h2 
            className="text-2xl md:text-3xl font-bold mb-4"
          >
            Ready to Start Your Learning Journey?
          </h2>
          <p 
            className="mb-6 text-red-100 max-w-2xl mx-auto"
          >
            Join thousands of successful students who transformed their education with our expert guidance.
          </p>
          <div
          >
            <Link to="/signup" className="relative inline-flex items-center gap-2 bg-white text-red-600 hover:text-purple-900 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 overflow-hidden group hover:scale-105 hover:shadow-2xl">
              <span 
                className="relative z-10"
              >
                Enroll Now
              </span>
              <svg 
                className="w-5 h-5 relative z-10"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <div 
                className="absolute inset-0 bg-gradient-to-r from-red-50 to-purple-50"
              />
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Help Button */}
      <div
        className="fixed bottom-8 right-8 z-50"
      >
        <Link
          to="/contact"
          className="bg-gradient-to-r from-red-600 to-purple-900 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl flex items-center gap-2 group"
        >
          <span>Need Help Choosing?</span>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </Link>
      </div>

      {/* Floating Rating Badge */}
      <div
        className="fixed bottom-8 left-8 z-50"
      >
        <div className="bg-white rounded-full p-4 shadow-2xl border border-red-200 hover:border-purple-600 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div 
              className="text-2xl"
            >
              ⭐
            </div>
            <div className="text-right">
              <div className="font-bold bg-gradient-to-r from-red-600 to-purple-900 bg-clip-text text-transparent">
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