// src/pages/Signup.jsx
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    course: ''  // Using 'course' as field name
  })
  
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Google state
  const [showMockGoogle, setShowMockGoogle] = useState(false)
  const [mockEmail, setMockEmail] = useState("")
  const [mockError, setMockError] = useState("")
  const [googleClientAvailable, setGoogleClientAvailable] = useState(false)

  const { signup, googleLogin } = useAuth()
  const navigate = useNavigate()

  // Load Google Identity Services button
  useEffect(() => {
    /* global google */
    const initGoogle = () => {
      if (window.google) {
        try {
          const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
          if (clientId) {
            google.accounts.id.initialize({
              client_id: clientId,
              callback: handleGoogleCredentialResponse,
            });
            google.accounts.id.renderButton(
              document.getElementById("googleSignUpDiv"),
              { theme: "outline", size: "large", width: "100%" }
            );
            setGoogleClientAvailable(true);
          }
        } catch (err) {
          console.error("Error initializing Google Identity Services:", err);
        }
      }
    };

    const timer = setTimeout(initGoogle, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleGoogleCredentialResponse = async (response) => {
    setIsSubmitting(true);
    setErrors({});
    try {
      const result = await googleLogin({ credential: response.credential });
      if (result && result.success) {
        if (result.user.role === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else {
          navigate("/student/dashboard", { replace: true });
        }
      } else {
        setErrors({ general: result?.error || "Google sign up failed" });
      }
    } catch (err) {
      setErrors({ general: "Google sign up failed. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMockGoogleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!mockEmail.trim()) {
      setMockError("Email is required");
      return;
    }
    if (!mockEmail.includes("@")) {
      setMockError("Please enter a valid email");
      return;
    }

    setIsSubmitting(true);
    setMockError("");
    setErrors({});
    try {
      const mockToken = `mock-token-${mockEmail.trim().toLowerCase()}`;
      const result = await googleLogin({ credential: mockToken });
      if (result && result.success) {
        setShowMockGoogle(false);
        if (result.user.role === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else {
          navigate("/student/dashboard", { replace: true });
        }
      } else {
        setMockError(result?.error || "Google Signup simulation failed");
      }
    } catch (err) {
      setMockError("Simulation failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Updated courses array as per requirement
  const courses = [
    // Primary (1-5)
    'Class 1',
    'Class 2',
    'Class 3',
    'Class 4',
    'Class 5',

    // Middle (6-8)
    'Class 6',
    'Class 7',
    'Class 8',

    // Foundation
    'Class 9',
    'Class 10',

    // Senior Secondary Commerce
    'Class 11 (Commerce)',
    'Class 12 (Commerce)',

    // Graduation
    'B.COM 1st Year',
    'B.COM 2nd Year',
    'B.COM 3rd Year',

    // Post Graduation
    'M.COM',

    // Competition
    'Competition Exams'
  ]

  const handleChange = (e) => {
    // For phone field, only allow numbers
    if (e.target.name === 'phone') {
      const value = e.target.value.replace(/\D/g, '')
      setFormData({
        ...formData,
        [e.target.name]: value
      })
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      })
    }
    
    // Clear error for this field when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (!/^[A-Za-z\s]{2,}$/.test(formData.name)) {
      newErrors.name = 'Name must contain only letters and at least 2 characters'
    }
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    // Phone validation
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits'
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    // Course selection validation
    if (!formData.course) {
      newErrors.course = 'Please select your class/course'
    }
    
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validateForm()

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare payload for backend
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        course: formData.course  // Sending selected course to backend
      }

      const result = await signup(payload)

      if (!result.success) {
        setErrors({ general: result.error || 'Registration failed. Please try again.' })
        return
      }

      navigate('/student/dashboard')

    } catch (error) {
      setErrors({ general: 'Registration failed. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-[80vh] py-12 px-4 bg-gray-50 fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-blue-900">Create Your Account</h1>
          <p className="text-gray-500 mt-2">Join thousands of successful students achieving their academic goals</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Registration Form */}
          <div className="card bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Student Registration</h2>
            
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Personal Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="name@gmail.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        maxLength="10"
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="10-digit number"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Class/Course Selection */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Select Your Class / Course</h3>
                <div>
                  <select
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                      errors.course ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Class / Course</option>
                    {courses.map((course, index) => (
                      <option key={index} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                  {errors.course && (
                    <p className="mt-1 text-xs text-red-600">{errors.course}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Set Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Create a password"
                    />
                    {errors.password && (
                      <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                    )}
                    <p className="mt-1 text-[11px] text-gray-400">
                      Must be at least 6 characters long
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Confirm your password"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="mt-1 mr-3 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="terms" className="text-xs text-gray-500">
                  I agree to the{' '}
                  <a href="#" className="text-blue-600 font-semibold hover:text-blue-700">
                    Terms & Conditions
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-blue-600 font-semibold hover:text-blue-700">
                    Privacy Policy
                  </a>
                </label>
              </div>

              {/* Submit */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all duration-200 shadow-sm"
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Already have an account?{' '}
                  <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>

            {/* Separator */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-400 font-medium">Or Register with</span>
              </div>
            </div>

            {/* Google Signup Actions */}
            <div className="space-y-3">
              {googleClientAvailable ? (
                <div id="googleSignUpDiv" className="w-full flex justify-center"></div>
              ) : null}

              <button
                type="button"
                onClick={() => setShowMockGoogle(true)}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 hover:bg-gray-50 rounded-lg text-gray-700 font-medium text-sm transition-colors duration-150"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google Sign Up
              </button>
            </div>
          </div>

          {/* Benefits & Info */}
          <div>
            <div className="card bg-white p-8 rounded-2xl shadow-lg border border-gray-100 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Why Register With Us?</h2>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 font-semibold">✓</span>
                  <span>Free demo class before enrollment</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 font-semibold">✓</span>
                  <span>Personalized study plan & course guides</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 font-semibold">✓</span>
                  <span>Access to premium recorded lectures</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 font-semibold">✓</span>
                  <span>Regular performance reports & analytics</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 font-semibold">✓</span>
                  <span>24/7 doubt solving support from faculty</span>
                </li>
              </ul>
            </div>

            <div className="card bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Admission Process</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Registration</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Fill this form to create your student account</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                    <span className="text-blue-600 font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Free Demo</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Attend a free demo class of your choice</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                    <span className="text-blue-600 font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Fee Payment</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Complete course fee payment online</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                    <span className="text-blue-600 font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Start Learning</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Access course material and join classes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Info */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex items-center mb-2">
                <span className="text-blue-600 mr-2 text-lg">📞</span>
                <span className="font-bold text-blue-900 text-sm">Need Help registering?</span>
              </div>
              <p className="text-xs text-blue-700 mb-2 leading-relaxed">
                Our admission counselors are available to assist you.
              </p>
              <div className="text-xs font-semibold text-blue-800 space-y-0.5">
                <p>Call: +91 9934522519</p>
                <p>WhatsApp: +91 8226871287</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mock Google Login Dialog */}
      {showMockGoogle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 relative border border-gray-100">
            <button
              onClick={() => {
                setShowMockGoogle(false);
                setMockError("");
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg font-bold"
            >
              &times;
            </button>
            <h3 className="text-lg font-bold text-blue-900 mb-2">Simulated Google Auth</h3>
            <p className="text-xs text-gray-500 mb-4">
              Enter any email address. If it matches a registered user, it logs you in; otherwise, it registers a new student.
            </p>

            <form onSubmit={handleMockGoogleLoginSubmit} className="space-y-4">
              {mockError && (
                <div className="p-2 bg-red-50 border border-red-200 text-red-600 rounded text-xs">
                  {mockError}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Gmail Address</label>
                <input
                  type="email"
                  placeholder="name@gmail.com"
                  value={mockEmail}
                  onChange={(e) => setMockEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors"
              >
                {isSubmitting ? "Processing..." : "Sign Up with Google"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Signup