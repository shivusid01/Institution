// src/pages/Contact.jsx
import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const Contact = () => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    course: '',
    message: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading for animations
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    
    // Clear errors when user types
    if (error) setError('')
    if (success) setSuccess('')
  }

  const validateForm = () => {
    if (!formData.name.trim()) return 'Name is required'
    if (!formData.email.trim()) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Please enter a valid email'
    if (!formData.phone.trim()) return 'Phone number is required'
    if (!/^[0-9]{10}$/.test(formData.phone)) return 'Phone number must be 10 digits'
    if (!formData.message.trim()) return 'Message is required'
    if (formData.message.trim().length < 10) return 'Message must be at least 10 characters'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }
    
    setIsSubmitting(true)
    setError('')
    setSuccess('')
    
    try {
      console.log('📤 Sending contact form:', formData)
      
      const response = await api.post('/contact/submit', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.course ? `Inquiry about ${formData.course}` : 'General Inquiry',
        message: formData.message
      })
      
      if (response.data.success) {
        setSuccess(response.data.message)
        setSubmitted(true)
        
        // Reset form (but keep user data if logged in)
        setFormData({
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          course: '',
          message: ''
        })
        
        // Auto-clear success message after 5 seconds
        setTimeout(() => {
          setSuccess('')
          setSubmitted(false)
        }, 5000)
      }
      
    } catch (err) {
      console.error('❌ Contact form error:', err)
      
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError('Failed to send message. Please try again later.')
      }
      
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactInfo = [
    {
      icon: '📍',
      title: 'Visit Us',
      details: ['Sharma Institute', 'Ramgarh, Jharkhand 829122', 'Near Main Market'],
      action: {
        text: 'Get Directions',
        url: 'https://www.google.com/maps/place/SHARMA+INSTITUTE/@23.677597,85.5103761,17z/data=!3m1!4b1!4m6!3m5!1s0x39f4f35dad3554bf:0x59bfae1bf6b7d040!8m2!3d23.677597!4d85.512951!16s%2Fg%2F11f53h7_lc'
      }
    },
    {
      icon: '📞',
      title: 'Call Us',
      details: ['+91 8226871265', 'Mon-Sat: 9AM-7PM', 'Sun: 10AM-2PM'],
      action: {
        text: 'Call Now',
        url: 'tel:+918226871265'
      }
    },
    {
      icon: '✉️',
      title: 'Email Us',
      details: ['sharmainstitute@gmail.com', 'admissions.sharma@gmail.com', 'support.sharma@gmail.com'],
      action: {
        text: 'Send Email',
        url: 'mailto:sharmainstitute@gmail.com'
      }
    }
  ]

  const branches = [
    { 
      city: 'Delhi', 
      address: 'Connaught Place, Central Delhi', 
      phone: '+91 11 1234 5678',
      email: 'delhi@sharmainstitute.com'
    },
    { 
      city: 'Mumbai', 
      address: 'Andheri West, Mumbai', 
      phone: '+91 22 2345 6789',
      email: 'mumbai@sharmainstitute.com'
    },
    { 
      city: 'Bangalore', 
      address: 'Koramangala, Bangalore', 
      phone: '+91 80 3456 7890',
      email: 'bangalore@sharmainstitute.com'
    },
    { 
      city: 'Kolkata', 
      address: 'Salt Lake City, Kolkata', 
      phone: '+91 33 4567 8901',
      email: 'kolkata@sharmainstitute.com'
    }
  ]

  const courses = [
    { value: '', label: 'Select a course' },
    { value: 'Academic (Class 1-8)', label: 'Academic (Class 1-8)' },
    { value: 'Foundation (Class 9-10)', label: 'Foundation (Class 9-10)' },
    { value: 'CBSE 11-12 (Commerce)', label: 'CBSE 11-12 (Commerce)' },
    { value: 'State Board 11-12 (Commerce)', label: 'State Board 11-12 (Commerce)' },
    { value: 'B.COM', label: 'B.COM' },
    { value: 'M.COM', label: 'M.COM' },
    { value: 'Competition Exams', label: 'Competition Exams' },
    { value: 'Other', label: 'Other Course' }
  ]

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
            Connecting you with our team
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-red-50 py-12 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Contact Form - Big on Top */}
        <div 
          className="mb-16"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="flex items-center mb-8">
              <div 
                className="p-3 bg-gradient-to-r from-red-100 to-purple-100 rounded-lg mr-4"
              >
                <span className="text-2xl">✍️</span>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-purple-900 bg-clip-text text-transparent">
                Send us a Message
              </h2>
            </div>
            
            {/* Messages */}
            
              {error && (
                <div 
                  className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg"
                >
                  <div className="flex items-center">
                    <svg 
                      className="w-5 h-5 text-red-500 mr-3"
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-red-800 font-medium">{error}</span>
                  </div>
                </div>
              )}
              
              {success && (
                <div 
                  className="mb-6 p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center">
                    <svg 
                      className="w-5 h-5 text-green-500 mr-3"
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="text-green-800 font-medium block">{success}</span>
                      <p className="text-green-700 text-sm mt-1">
                        Your message has been sent to our admin team. We'll contact you soon.
                      </p>
                    </div>
                  </div>
                </div>
              )}

<form onSubmit={handleSubmit}>
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all duration-300 hover:border-red-300"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-300 hover:border-purple-300"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all duration-300 hover:border-red-300"
                      placeholder="10-digit number"
                    />
                  </div>
                  <div
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Interested Course
                    </label>
                    <select
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-300 hover:border-purple-300"
                    >
                      {courses.map((course) => (
                        <option key={course.value} value={course.value}>
                          {course.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div
                >
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Your Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all duration-300 hover:border-red-300"
                    placeholder="Please describe your inquiry in detail..."
                  />
                  <p className="text-xs text-gray-500 mt-3">
                    Please provide as much detail as possible so we can assist you better.
                  </p>
                </div>

                <div
                >
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 px-6 bg-gradient-to-r from-red-600 to-purple-900 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group overflow-hidden relative"
                  >
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-purple-900 to-red-600"
                    />
                    <span className="relative z-10 flex items-center">
                      {isSubmitting ? (
                        <>
                          <svg 
                            className="animate-spin h-6 w-6 mr-3 text-white" 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24"
                          >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending Message...
                        </>
                      ) : (
                        <>
                          <span className="text-xl mr-3">📤</span>
                          Send Message
                          <svg 
                            className="w-5 h-5 ml-3"
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </>
                      )}
                    </span>
                  </button>
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    <span className="text-red-600">🔒</span> Your information is secure. We don't share your details with anyone.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Hero Section */}
        <div 
          className="text-center mb-16"
        >
          <div 
            className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-red-100 to-purple-100 rounded-full mb-6 shadow-lg"
          >
            <span className="text-4xl">📞</span>
          </div>
          <h1 
            className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-red-600 via-purple-600 to-purple-900 bg-clip-text text-transparent"
          >
            Get in Touch With Us
          </h1>
          <p 
            className="text-xl text-gray-700 max-w-3xl mx-auto"
          >
            Have questions? We're here to help. Our team will respond to your inquiry within 24 hours.
          </p>
        </div>

        {/* Contact Information Cards */}
        <div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          {contactInfo.map((info, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300"
              style={{ borderWidth: '2px', borderColor: 'transparent' }}
            >
              <div 
                className="text-5xl mb-6 text-center"
              >
                {info.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                {info.title}
              </h3>
              <div className="space-y-3 mb-8">
                {info.details.map((detail, idx) => (
                  <p 
                    key={idx} 
                    className="text-gray-700 text-center"
                  >
                    {detail}
                  </p>
                ))}
              </div>
              <div className="text-center">
                <a
                  href={info.action.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-purple-900 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300 overflow-hidden group"
                >
                  <span className="relative z-10">{info.action.text}</span>
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-purple-900 to-red-600"
                  />
                  <svg 
                    className="w-4 h-4 ml-2 relative z-10"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Map Section */}
          <div 
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="flex items-center mb-8">
              <div 
                className="p-3 bg-gradient-to-r from-red-100 to-purple-100 rounded-lg mr-4"
              >
                <span className="text-2xl">🗺️</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-purple-900 bg-clip-text text-transparent">
                Find Our Main Campus
              </h2>
            </div>
            <div className="relative bg-gradient-to-br from-red-50 to-purple-50 h-64 rounded-xl flex flex-col items-center justify-center mb-6 overflow-hidden">
              {/* Floating particles */}
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-gradient-to-r from-red-300 to-purple-300 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                />
              ))}
              
              <div 
                className="text-5xl mb-4"
              >
                📍
              </div>
              <p className="text-gray-800 font-bold text-lg">Sharma Institute</p>
              <p className="text-gray-600">Ramgarh, Jharkhand 829122</p>
            </div>
            <div className="text-center">
              <a
                href="https://www.google.com/maps/place/SHARMA+INSTITUTE/@23.677597,85.5103761,17z/data=!3m1!4b1!4m6!3m5!1s0x39f4f35dad3554bf:0x59bfae1bf6b7d040!8m2!3d23.677597!4d85.512951!16s%2Fg%2F11f53h7_lc"
                target="_blank"
                rel="noopener noreferrer"
                className="relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white font-medium rounded-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                <span className="mr-3">🚗</span>
                Get Directions on Google Maps
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-800"
                />
              </a>
            </div>
          </div>

          {/* Business Hours */}
          <div 
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="flex items-center mb-8">
              <div 
                className="p-3 bg-gradient-to-r from-purple-100 to-red-100 rounded-lg mr-4"
              >
                <span className="text-2xl">🕒</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-red-600 bg-clip-text text-transparent">
                Business Hours
              </h2>
            </div>
            <div className="space-y-6">
              {[
                { day: 'Monday - Friday', time: '9:00 AM - 7:00 PM', icon: '🏢', color: 'from-red-50 to-red-100' },
                { day: 'Saturday', time: '9:00 AM - 5:00 PM', icon: '📚', color: 'from-purple-50 to-purple-100' },
                { day: 'Sunday', time: '10:00 AM - 2:00 PM', icon: '☕', color: 'from-red-50 to-purple-50' },
                { day: 'Admission Office', time: 'Open 24/7 Online', icon: '🌐', color: 'from-purple-50 to-red-50' },
                { day: 'Emergency Support', time: '24/7 Available', icon: '🚨', color: 'from-red-100 to-purple-100' }
              ].map((hour, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between py-5 px-6 rounded-xl"
                  style={{ 
                    background: `linear-gradient(to right, var(--tw-gradient-stops))`,
                    '--tw-gradient-from': hour.color.split(' ')[1],
                    '--tw-gradient-to': hour.color.split(' ')[3],
                  }}
                >
                  <div className="flex items-center">
                    <span 
                      className="text-2xl mr-4"
                    >
                      {hour.icon}
                    </span>
                    <span className="font-bold text-gray-900">{hour.day}</span>
                  </div>
                  <span 
                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-purple-900 text-white font-semibold rounded-lg shadow-md"
                  >
                    {hour.time}
                  </span>
                </div>
              ))}
            </div>
            <div 
              className="mt-8 p-5 bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-300 rounded-xl"
            >
              <p className="text-sm text-yellow-900 flex items-center">
                <span 
                  className="text-lg mr-2"
                >
                  ⚠️
                </span>
                <span>
                  <span className="font-bold">Note:</span> During holidays, timings may vary. 
                  Please check our notices section for updates.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Response Info */}
        <div 
          className="mt-16 bg-gradient-to-r from-red-50 to-purple-50 border border-red-200 rounded-2xl p-8 shadow-lg"
        >
          <div className="flex items-center mb-6">
            <div 
              className="p-3 bg-gradient-to-r from-red-100 to-purple-100 rounded-lg mr-4"
            >
              <span className="text-red-600 text-xl">⚡</span>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-purple-900 bg-clip-text text-transparent">
              Quick Response Guarantee
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { text: 'Response within 24 hours', icon: '⏱️' },
              { text: '7 days a week support', icon: '📅' },
              { text: 'Expert guidance', icon: '👨‍🏫' },
              { text: 'No spam, guaranteed', icon: '🛡️' }
            ].map((item, index) => (
              <div 
                key={index}
                className="flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
              >
                <span 
                  className="text-2xl mr-4"
                >
                  {item.icon}
                </span>
                <span className="font-medium text-gray-900">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Help Button */}
      <div
        className="fixed bottom-8 right-8 z-50"
      >
        <a
          href="tel:+918226871265"
          className="bg-gradient-to-r from-red-600 to-purple-900 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl flex items-center gap-2 group"
        >
          <span>📞 Call Now</span>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </a>
      </div>

      {/* Floating WhatsApp Button */}
      <div
        className="fixed bottom-8 left-8 z-50"
      >
        <a
          href="https://wa.me/918226871265"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          <span className="text-xl">💬</span>
          <span>WhatsApp</span>
        </a>
      </div>
    </div>
  )
}

export default Contact