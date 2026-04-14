// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import logo from '../assets/img.svg'

const Navbar = () => {
  const { user, loading, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
    setIsMobileMenuOpen(false)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Navigation items
  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/courses', label: 'Courses' },
    { path: '/contact', label: 'Contact' },
  ]

  // Loading state with animation
  if (loading) {
    return (
      <nav 
        className="bg-white shadow-lg"
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div 
                className="h-12 w-12 bg-gradient-to-r from-red-200 to-purple-200 rounded-xl animate-pulse"
              />
              <div className="h-7 w-40 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
            </div>
            <div className="h-7 w-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav 
      className={`bg-white shadow-lg sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'shadow-xl bg-white/95 backdrop-blur-sm' : ''
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo - Larger */}
          <Link to="/" className="flex items-center space-x-3 group" onClick={() => setIsMobileMenuOpen(false)}>
            <div 
              className="relative"
            >
              <img src={logo} alt="Sharma Institute" className="h-14 w-20" />
              <div 
                className="absolute inset-0 border-2 border-transparent rounded-lg group-hover:border-red-300"
              />
            </div>
            <div className="hidden md:block">
              <span 
                className="text-2xl font-bold bg-gradient-to-r from-red-600 to-purple-900 bg-clip-text text-transparent"
              >
                Sharma Institute
              </span>
              <p 
                className="text-xs text-gray-500"
              >
                Excellence in Education
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex flex-nowrap space-x-6">
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.path
              return (
                <div
                  key={item.path}
                >
                  <Link 
                    to={item.path}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-r from-red-50 to-purple-50 text-red-600 border border-red-200' 
                        : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && (
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 to-purple-900"
                      />
                    )}
                  </Link>
                </div>
              )
            })}
            
            {/* Conditional Links based on Auth State */}
            {isAuthenticated && user && (
              <div
              >
                {/* Documents Link - For both students and admins/teachers */}
                <Link 
                  to="/documents" 
                  className="px-4 py-2 rounded-lg font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-300"
                >
                   Study Materials
                </Link>
                
                {user.role === 'student' && (
                  <Link 
                    to="/student/dashboard" 
                    className="px-4 py-2 rounded-lg font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300"
                  >
                    Dashboard
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link 
                    to="/admin/dashboard" 
                    className="px-4 py-2 rounded-lg font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300"
                  >
                    Admin Panel
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Auth Buttons & User Info - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && user ? (
              <div 
                className="flex items-center space-x-4"
              >
                <div 
                  className="flex items-center space-x-3 group cursor-pointer"
                >
                  <div 
                    className="h-10 w-10 rounded-full bg-gradient-to-r from-red-500 to-purple-600 flex items-center justify-center shadow-lg relative overflow-hidden"
                  >
                    <span className="text-white font-bold text-lg relative z-10">
                      {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-purple-600 to-red-500"
                    />
                  </div>
                  <div>
                    <p 
                      className="text-gray-700 font-medium text-sm group-hover:text-red-600 transition-colors"
                    >
                      {user.name || user.email}
                    </p>
                    <p 
                      className="text-xs text-gray-500 capitalize bg-gradient-to-r from-red-100 to-purple-100 px-2 py-0.5 rounded-full inline-block"
                    >
                      {user.role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="relative px-5 py-2 bg-gradient-to-r from-red-600 to-purple-900 text-white rounded-lg hover:shadow-lg font-medium overflow-hidden group"
                >
                  <span className="relative z-10">Logout</span>
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-purple-900 to-red-600"
                  />
                </button>
              </div>
            ) : (
              <div 
                className="flex items-center space-x-4"
              >
                <Link 
                  to="/login" 
                  className="px-5 py-2 text-gray-700 hover:text-red-600 font-medium rounded-lg hover:bg-red-50 transition-all duration-300 group"
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="relative px-6 py-2.5 bg-gradient-to-r from-red-600 to-purple-900 text-white rounded-lg hover:shadow-lg font-medium overflow-hidden group"
                >
                  <span className="relative z-10">Sign Up</span>
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-purple-900 to-red-600"
                  />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button 
            onClick={toggleMobileMenu}
            className="md:hidden text-gray-700 focus:outline-none p-2 rounded-lg hover:bg-gray-100"
          >
            {isMobileMenuOpen ? (
              <svg 
                className="w-7 h-7"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg 
                className="w-7 h-7"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu with Animation */}
        
          {isMobileMenuOpen && (
            <div 
              className="md:hidden border-t border-gray-200 bg-white"
            >
              <div className="py-4 px-4">
                <div className="flex flex-col space-y-3">
                  {navItems.map((item, index) => {
                    const isActive = location.pathname === item.path
                    return (
                      <div
                        key={item.path}
                      >
                        <Link 
                          to={item.path}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                            isActive 
                              ? 'bg-gradient-to-r from-red-50 to-purple-50 text-red-600' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <span className="text-lg">{item.label}</span>
                          {isActive && (
                            <div 
                              className="ml-auto h-2 w-2 rounded-full bg-gradient-to-r from-red-600 to-purple-900"
                            />
                          )}
                        </Link>
                      </div>
                    )
                  })}
                  
                  {/* Conditional Mobile Links */}
                  {isAuthenticated && user && (
                    <div
                    >
                      <Link 
                        to="/documents" 
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-all duration-300"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="text-lg">Study Materials</span>
                      </Link>
                      
                      {user.role === 'student' && (
                        <Link 
                          to="/student/dashboard" 
                          className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-all duration-300"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <span className="text-lg">Dashboard</span>
                        </Link>
                      )}
                      {user.role === 'admin' && (
                        <Link 
                          to="/admin/dashboard" 
                          className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-all duration-300"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <span className="text-lg">Admin Panel</span>
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Mobile Auth Section */}
                  <div 
                    className="pt-4 border-t border-gray-200"
                  >
                    {isAuthenticated && user ? (
                      <>
                        <div 
                          className="flex items-center space-x-3 mb-4 p-4 bg-gradient-to-r from-red-50 to-purple-50 rounded-lg"
                        >
                          <div 
                            className="h-12 w-12 rounded-full bg-gradient-to-r from-red-500 to-purple-600 flex items-center justify-center shadow-md"
                          >
                            <span className="text-white font-bold text-xl">
                              {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name || user.email}</p>
                            <p className="text-sm text-gray-600 capitalize bg-gradient-to-r from-red-100 to-purple-100 px-2 py-0.5 rounded-full inline-block">
                              {user.role}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-purple-900 text-white rounded-lg hover:shadow-lg font-medium text-center"
                        >
                          Logout
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col space-y-3">
                        <Link 
                          to="/login" 
                          className="w-full px-4 py-3 text-center bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Login
                        </Link>
                        <Link 
                          to="/signup" 
                          className="w-full px-4 py-3 text-center bg-gradient-to-r from-red-600 to-purple-900 text-white rounded-lg hover:shadow-lg font-medium"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Sign Up
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        
      </div>
    </nav>
  )
}

export default Navbar