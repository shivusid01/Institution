// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { renderGroupedClassOptions } from '../constants/classData'

import logo from '../assets/logo.jpg'

const UserAvatar = ({ user, getImageUrl, isMobile = false }) => {
  const [imageError, setImageError] = useState(false);
  const profilePic = user?.profileImage || user?.profilePic || user?.profilePicture || user?.avatar;
  const initial = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';

  useEffect(() => {
    setImageError(false);
  }, [profilePic]);

  const containerClass = isMobile
    ? "h-8 w-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center overflow-hidden flex-shrink-0"
    : "h-10 w-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shadow-sm relative overflow-hidden flex-shrink-0";

  const textClass = isMobile ? "text-blue-800 font-bold text-sm" : "text-blue-800 font-bold text-lg";

  return (
    <div className={containerClass}>
      {profilePic && !imageError ? (
        <img 
          src={getImageUrl(profilePic)} 
          alt="Profile" 
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className={textClass}>{initial}</span>
      )}
    </div>
  );
};

const Navbar = () => {
  const { user, loading, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isFreeMaterialHovered, setIsFreeMaterialHovered] = useState(false)
  const [isMobileFreeMaterialOpen, setIsMobileFreeMaterialOpen] = useState(false)

  // Mandatory details modal state
  const [showMandatoryModal, setShowMandatoryModal] = useState(false)
  const [targetCategory, setTargetCategory] = useState('Study Material')
  const [modalFormData, setModalFormData] = useState({
    name: '',
    phone: '',
    email: '',
    studentClass: ''
  })
  const [modalError, setModalError] = useState('')

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;
    const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const baseUrl = apiURL.replace(/\/api\/?$/, '');
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${cleanPath}`;
  };

  const handleLogout = () => {
    logout()
    navigate('/login')
    setIsMobileMenuOpen(false)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const freeMaterialCategories = [
    { name: 'Study Material', icon: '📚' },
    { name: 'Current Affairs', icon: '📰' },
    { name: 'Checked Copy', icon: '📝' },
    { name: 'Results', icon: '🏆' }
  ]

  const handleCategoryClick = (categoryName) => {
    const existingDetails = localStorage.getItem('freeMaterialUserDetails')
    setIsFreeMaterialHovered(false)
    setIsMobileMenuOpen(false)
    setIsMobileFreeMaterialOpen(false)

    if (isAuthenticated || existingDetails) {
      navigate(`/documents?category=${encodeURIComponent(categoryName)}`)
    } else {
      setTargetCategory(categoryName)
      setShowMandatoryModal(true)
    }
  }

  const handleModalSubmit = (e) => {
    e.preventDefault()
    if (!modalFormData.name.trim() || !modalFormData.phone.trim() || !modalFormData.email.trim() || !modalFormData.studentClass) {
      setModalError('Please fill in all required fields.')
      return
    }

    localStorage.setItem('freeMaterialUserDetails', JSON.stringify(modalFormData))
    setShowMandatoryModal(false)
    setModalError('')
    navigate(`/documents?category=${encodeURIComponent(targetCategory)}`)
  }

  // Navigation items
  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/courses', label: 'Courses' },
    { path: '/contact', label: 'Contact' },
  ]

  if (loading) {
    return (
      <nav className="bg-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-gradient-to-r from-blue-200 to-blue-200 rounded-xl animate-pulse" />
              <div className="h-7 w-40 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
            </div>
            <div className="h-7 w-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <>
      <nav className="w-full sticky top-0 z-50 shadow-md">
        {/* Top Header Row (Logo & Auth Buttons) */}
        <div className="bg-white border-b border-gray-100 py-3">
          <div className="container mx-auto px-4 flex justify-between items-center">
            {/* Logo and Institution Title */}
            <a href="/" className="flex items-center space-x-3 group" onClick={() => setIsMobileMenuOpen(false)}>
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
            </a>

            {/* Desktop Auth Section */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-4">
                  <a 
                    href={user.role === 'student' ? '/student/profile' : '#'} 
                    className={`flex items-center space-x-3 transition-opacity ${user.role === 'student' ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}
                  >
                    <UserAvatar user={user} getImageUrl={getImageUrl} />
                    <div className="text-right">
                      <p className="text-gray-800 font-medium text-sm">
                        {user.name || user.email}
                      </p>
                      <span className="text-[10px] text-blue-700 font-semibold uppercase bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        {user.role}
                      </span>
                    </div>
                  </a>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm border border-gray-300 hover:border-blue-600 hover:text-blue-600 rounded-lg text-gray-600 transition-all font-medium duration-200"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <a 
                    href="/login" 
                    className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-all duration-200"
                  >
                    Login
                  </a>
                  <a 
                    href="/signup" 
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm hover:shadow transition-all duration-200"
                  >
                    Sign Up
                  </a>
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

        {/* Bottom Main Navigation Menu */}
        <div className="bg-[#0b4d82] text-white hidden md:block border-t border-blue-900/30">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center space-x-1 py-1">
              {/* Home Icon */}
              <a 
                href="/"
                className={`p-3 hover:bg-[#1a5b8c] transition-colors ${
                  location.pathname === '/' ? 'bg-[#1a5b8c]' : ''
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </a>

              {/* Navigation Links */}
              {navItems.filter(item => item.path !== '/').map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <a 
                    key={item.path}
                    href={item.path}
                    className={`px-5 py-3 font-medium text-sm transition-colors border-r border-blue-700/40 hover:bg-[#1a5b8c] ${
                      isActive ? 'bg-[#1a5b8c] font-semibold text-white' : 'text-blue-50'
                    }`}
                  >
                    {item.label}
                  </a>
                )
              })}

              {/* Free Material Hover Dropdown */}
              <div 
                className="relative inline-block text-left border-r border-blue-700/40"
                onMouseEnter={() => setIsFreeMaterialHovered(true)}
                onMouseLeave={() => setIsFreeMaterialHovered(false)}
              >
                <button
                  className={`px-5 py-3 font-medium text-sm transition-colors inline-flex items-center space-x-1 ${
                    location.pathname === '/documents' ? 'bg-[#1a5b8c] font-semibold text-white' : 'text-blue-50 hover:bg-[#1a5b8c]'
                  }`}
                >
                  <span>Free Material</span>
                  <svg className={`w-4 h-4 ml-1 transform transition-transform ${isFreeMaterialHovered ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isFreeMaterialHovered && (
                  <div className="absolute left-0 w-56 rounded-b-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
                    <div className="py-1">
                      {freeMaterialCategories.map((cat) => (
                        <button
                          key={cat.name}
                          onClick={() => handleCategoryClick(cat.name)}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 transition-colors border-b border-gray-50 last:border-0"
                        >
                          <span className="text-base">{cat.icon}</span>
                          <span className="font-medium">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Conditional Links for Logged-In Roles */}
              {isAuthenticated && user && (
                <>
                  {user.role === 'student' && (
                    <a 
                      href="/student/dashboard" 
                      className={`px-5 py-3 font-medium text-sm transition-colors border-r border-blue-700/40 hover:bg-[#1a5b8c] ${
                        location.pathname.startsWith('/student') ? 'bg-[#1a5b8c] font-semibold text-white' : 'text-blue-50'
                      }`}
                    >
                      Dashboard
                    </a>
                  )}
                  {user.role === 'admin' && (
                    <a 
                      href="/admin/dashboard" 
                      className={`px-5 py-3 font-medium text-sm transition-colors border-r border-blue-700/40 hover:bg-[#1a5b8c] ${
                        location.pathname.startsWith('/admin') ? 'bg-[#1a5b8c] font-semibold text-white' : 'text-blue-50'
                      }`}
                    >
                      Admin Panel
                    </a>
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
                  <a 
                    key={item.path}
                    href={item.path}
                    className={`px-4 py-2.5 rounded-lg text-base font-medium transition-all ${
                      isActive ? 'bg-[#1a5b8c] text-white' : 'text-blue-100 hover:bg-[#1a5b8c]/50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                )
              })}

              {/* Mobile Free Material Accordion */}
              <div>
                <button
                  onClick={() => setIsMobileFreeMaterialOpen(!isMobileFreeMaterialOpen)}
                  className={`w-full flex justify-between items-center px-4 py-2.5 rounded-lg text-base font-medium transition-all ${
                    location.pathname === '/documents' ? 'bg-[#1a5b8c] text-white' : 'text-blue-100 hover:bg-[#1a5b8c]/50'
                  }`}
                >
                  <span>Free Material</span>
                  <svg className={`w-4 h-4 transform transition-transform ${isMobileFreeMaterialOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isMobileFreeMaterialOpen && (
                  <div className="pl-6 pr-2 py-1 space-y-1 bg-[#093c66] rounded-lg mt-1">
                    {freeMaterialCategories.map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => handleCategoryClick(cat.name)}
                        className="w-full text-left px-3 py-2 text-sm text-blue-100 hover:text-white flex items-center space-x-2 rounded"
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isAuthenticated && user && (
                <>
                  {user.role === 'student' && (
                    <a 
                      href="/student/dashboard" 
                      className={`px-4 py-2.5 rounded-lg text-base font-medium transition-all ${
                        location.pathname.startsWith('/student') ? 'bg-[#1a5b8c] text-white' : 'text-blue-100 hover:bg-[#1a5b8c]/50'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </a>
                  )}
                  {user.role === 'admin' && (
                    <a 
                      href="/admin/dashboard" 
                      className={`px-4 py-2.5 rounded-lg text-base font-medium transition-all ${
                        location.pathname.startsWith('/admin') ? 'bg-[#1a5b8c] text-white' : 'text-blue-100 hover:bg-[#1a5b8c]/50'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Admin Panel
                    </a>
                  )}
                </>
              )}

              {/* Mobile Auth Actions */}
              <div className="pt-3 pb-2 border-t border-blue-800 mt-2">
                {isAuthenticated && user ? (
                  <div className="flex flex-col space-y-2">
                    <div className="px-4 py-2 bg-[#1a5b8c] rounded-lg flex items-center space-x-3">
                      <UserAvatar user={user} getImageUrl={getImageUrl} isMobile={true} />
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
                    <a 
                      href="/login" 
                      className="w-full py-2.5 bg-[#1a5b8c] text-center text-white rounded-lg font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Login
                    </a>
                    <a 
                      href="/signup" 
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-center text-white rounded-lg font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign Up
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Mandatory Details Modal for Free Material Access */}
      {showMandatoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-5 text-white relative">
              <button
                onClick={() => setShowMandatoryModal(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex items-center space-x-3">
                <span className="text-3xl">📚</span>
                <div>
                  <h3 className="text-xl font-bold text-white">Access Free Material</h3>
                  <p className="text-xs text-blue-100 mt-0.5">Please provide your details to continue to {targetCategory}</p>
                </div>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={modalFormData.name}
                  onChange={(e) => setModalFormData({ ...modalFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Enter 10-digit mobile number"
                  value={modalFormData.phone}
                  onChange={(e) => setModalFormData({ ...modalFormData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={modalFormData.email}
                  onChange={(e) => setModalFormData({ ...modalFormData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Select Class / Course <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={modalFormData.studentClass}
                  onChange={(e) => setModalFormData({ ...modalFormData, studentClass: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-all bg-white text-gray-800"
                >
                  <option value="">-- Select Class / Course --</option>
                  {renderGroupedClassOptions()}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3 border-t border-gray-100 mt-5">
                <button
                  type="button"
                  onClick={() => setShowMandatoryModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition-all"
                >
                  Submit & Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar