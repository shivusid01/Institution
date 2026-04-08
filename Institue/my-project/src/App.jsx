// src/App.jsx
import React, { useState, useEffect } from 'react'
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  Outlet 
} from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import About from './pages/About'
import Courses from './pages/Courses'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Documents from './pages/Documents'
// import ClassDetails from './pages/student/ClassDetails'
import StudentDashboard from './pages/student/Dashboard'
import StudentClasses from './pages/student/Classes'
import StudentPayment from './pages/student/Payment'
import PaymentHistory from './pages/student/PaymentHistory'
import StudentNotices from './pages/student/Notices'
import StudentProfile from './pages/student/Profile'
import AdminDashboard from './pages/admin/Dashboard'
import ManageCourses from './pages/admin/ManageCourses'
import ManageStudents from './pages/admin/ManageStudents'
// import ClassControl from './pages/admin/ClassControl'
import PaymentRecords from './pages/admin/PaymentRecords'
import NoticesManagement from './pages/admin/NoticesManagement'
// import Reports from './pages/admin/Reports'

import { AuthProvider, useAuth } from './context/AuthContext'

function App() {
  const [cursor, setCursor] = useState({ x: -100, y: -100, active: false })

  useEffect(() => {
    const handleMouseMove = (event) => {
      setCursor({ x: event.clientX, y: event.clientY, active: true })
    }
    const handleMouseLeave = () => {
      setCursor((prev) => ({ ...prev, active: false }))
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <Router future={{ v7_relativeSplatPath: true }}> 
      <AuthProvider>
        <div className="min-h-screen flex flex-col fade-in-page">
          <Navbar />
          <main className="flex-grow fade-in">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Protected Documents Route - For authenticated users */}
              <Route element={<ProtectedRoute allowedRoles={['student', 'admin', 'teacher']} />}>
                <Route path="/documents" element={<Documents />} />
              </Route>
              
              {/* Protected Student Routes */}
              <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                {/* <Route path="/student/class/:id" element={<ClassDetails />} /> */}
                <Route path="/student/classes" element={<StudentClasses />} />
                <Route path="/student/payment" element={<StudentPayment />} />
                <Route path="/student/payment-history" element={<PaymentHistory />} />
                <Route path="/student/notices" element={<StudentNotices />} />
                <Route path="/student/profile" element={<StudentProfile />} />
                
              </Route>
              
              {/* Protected Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/courses" element={<ManageCourses />} />
                <Route path="/admin/students" element={<ManageStudents />} />
                {/* <Route path="/admin/classes" element={<ClassControl />} /> */}
                <Route path="/admin/payments" element={<PaymentRecords />} />
                <Route path="/admin/notices" element={<NoticesManagement />} />
                {/* <Route path="/admin/reports" element={<Reports />} /> */}
              </Route>
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <Footer />

          <div
            className={`custom-cursor ${cursor.active ? 'cursor-active' : ''}`}
            style={{ left: cursor.x, top: cursor.y }}
            aria-hidden="true"
          />
        </div>
      </AuthProvider>
    </Router>
  )
}

// Protected Route Component - CORRECTED
function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth() // ✅ user, currentUser नहीं
  
  console.log("🛡️ ProtectedRoute check:", {
    hasUser: !!user,
    userRole: user?.role,
    loading,
    allowedRoles
  })
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  if (!user) {
    console.log("❌ No user, redirecting to login")
    return <Navigate to="/login" replace />
  }
  
  if (!allowedRoles.includes(user.role)) {
    console.log(`❌ Role ${user.role} not allowed. Redirecting...`)
    // Redirect to appropriate dashboard
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />
    } else {
      return <Navigate to="/student/dashboard" replace />
    }
  }
  
  console.log("✅ Access granted for role:", user.role)
  return <Outlet />
}

export default App
