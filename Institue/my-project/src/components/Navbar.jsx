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

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const baseUrl = apiURL.replace('/api', '');
    return `${baseUrl}${imagePath}`;
  };

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
                className="h-12 w-12 bg-gradient-to-r from-blue-200 to-blue-200 rounded-xl animate-pulse"
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
    <nav className="w-full sticky top-0 z-50 shadow-md">
      {/* Top Header Row (Logo & Auth Buttons) */}
      <div className="bg-white border-b border-gray-100 py-3">
        <div className="container mx-auto px-4 flex justify-between items-center">
          {/* Logo and Institution Title */}
          <Link to="/" className="flex items-center space-x-3 group" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="relative">
              <img src={logo} alt="Sharma Institute" className="h-14 w-20 object-contain" />
            </div>
            <div>
              <span className="text-2xl font-bold text-blue-900 group-hover:text-blue-700 transition-colors">
                Sharma Institute
              </span>
              <p className="text-xs text-gray-500 font-medium tracking-wide">
                Excellence in Education
              </p>
            </div>
          </Link>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-4">
                <Link 
                  to={user.role === 'student' ? '/student/profile' : '#'} 
                  className={`flex items-center space-x-3 transition-opacity ${user.role === 'student' ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}
                >
                  <div className="h-10 w-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shadow-sm relative overflow-hidden">
                    {user.profileImage ? (
                      <img 
                        src={getImageUrl(user.profileImage)} 
                        alt="Profile" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-blue-800 font-bold text-lg">
                        {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-gray-800 font-medium text-sm">
                      {user.name || user.email}
                    </p>
                    <span className="text-[10px] text-blue-700 font-semibold uppercase bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      {user.role}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm border border-gray-300 hover:border-blue-600 hover:text-blue-600 rounded-lg text-gray-600 transition-all font-medium duration-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/login" 
                  className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-all duration-200"
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm hover:shadow transition-all duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button 
            onClick={toggleMobileMenu}
            className="md:hidden text-gray-700 focus:outline-none p-2 rounded-lg hover:bg-gray-100"
          >
            {isMobileMenuOpen ? (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Main Navigation Menu (Deep Blue UPSC style) */}
      <div className="bg-[#0b4d82] text-white hidden md:block border-t border-blue-900/30">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-1 py-1">
            {/* Home Icon */}
            <Link 
              to="/"
              className={`p-3 hover:bg-[#1a5b8c] transition-colors ${
                location.pathname === '/' ? 'bg-[#1a5b8c]' : ''
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </Link>

            {/* Other Navigation Links */}
            {navItems.filter(item => item.path !== '/').map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link 
                  key={item.path}
                  to={item.path}
                  className={`px-5 py-3 font-medium text-sm transition-colors border-r border-blue-700/40 hover:bg-[#1a5b8c] ${
                    isActive ? 'bg-[#1a5b8c] font-semibold text-white' : 'text-blue-50'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
            
            {/* Conditional Links based on Auth State */}
            {isAuthenticated && user && (
              <>
                <Link 
                  to="/documents" 
                  className={`px-5 py-3 font-medium text-sm transition-colors border-r border-blue-700/40 hover:bg-[#1a5b8c] ${
                    location.pathname === '/documents' ? 'bg-[#1a5b8c] font-semibold text-white' : 'text-blue-50'
                  }`}
                >
                  Study Materials
                </Link>
                
                {user.role === 'student' && (
                  <Link 
                    to="/student/dashboard" 
                    className={`px-5 py-3 font-medium text-sm transition-colors border-r border-blue-700/40 hover:bg-[#1a5b8c] ${
                      location.pathname.startsWith('/student') ? 'bg-[#1a5b8c] font-semibold text-white' : 'text-blue-50'
                    }`}
                  >
                    Dashboard
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link 
                    to="/admin/dashboard" 
                    className={`px-5 py-3 font-medium text-sm transition-colors border-r border-blue-700/40 hover:bg-[#1a5b8c] ${
                      location.pathname.startsWith('/admin') ? 'bg-[#1a5b8c] font-semibold text-white' : 'text-blue-50'
                    }`}
                  >
                    Admin Panel
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0b4d82] text-white border-t border-blue-800">
          <div className="py-2 px-4 flex flex-col space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link 
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2.5 rounded-lg text-base font-medium transition-all ${
                    isActive ? 'bg-[#1a5b8c] text-white' : 'text-blue-100 hover:bg-[#1a5b8c]/50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              )
            })}

            {isAuthenticated && user && (
              <>
                <Link 
                  to="/documents" 
                  className={`px-4 py-2.5 rounded-lg text-base font-medium transition-all ${
                    location.pathname === '/documents' ? 'bg-[#1a5b8c] text-white' : 'text-blue-100 hover:bg-[#1a5b8c]/50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Study Materials
                </Link>
                
                {user.role === 'student' && (
                  <Link 
                    to="/student/dashboard" 
                    className={`px-4 py-2.5 rounded-lg text-base font-medium transition-all ${
                      location.pathname.startsWith('/student') ? 'bg-[#1a5b8c] text-white' : 'text-blue-100 hover:bg-[#1a5b8c]/50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link 
                    to="/admin/dashboard" 
                    className={`px-4 py-2.5 rounded-lg text-base font-medium transition-all ${
                      location.pathname.startsWith('/admin') ? 'bg-[#1a5b8c] text-white' : 'text-blue-100 hover:bg-[#1a5b8c]/50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}
              </>
            )}

            {/* Mobile Auth Actions */}
            <div className="pt-3 pb-2 border-t border-blue-800 mt-2">
              {isAuthenticated && user ? (
                <div className="flex flex-col space-y-2">
                  <div className="px-4 py-2 bg-[#1a5b8c] rounded-lg flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                      {user.profileImage ? (
                        <img 
                          src={getImageUrl(user.profileImage)} 
                          alt="Profile" 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-blue-800 font-bold text-sm">
                          {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-blue-100 font-medium">Logged in as</p>
                      <p className="text-sm font-bold text-white leading-tight">{user.name || user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full py-2.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg font-medium text-center transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Link 
                    to="/login" 
                    className="w-full py-2.5 bg-[#1a5b8c] text-center text-white rounded-lg font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/signup" 
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-center text-white rounded-lg font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar