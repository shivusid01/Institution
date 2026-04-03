// src/components/Footer.jsx
import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer 
      className="bg-gradient-to-r from-gray-800 to-gray-900 text-white"
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div
          >
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-red-400 to-purple-400 bg-clip-text text-transparent">
              Sharma Institute
            </h2>
            <p className="text-gray-400">
              Premier coaching institute for 
              <br />
              competitive exams and 
              <br />
              academic excellence.
            </p>
          </div>

          {/* Quick Links */}
          <div
          >
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {['Home', 'About Us', 'Courses', 'Contact'].map((link, index) => (
                <li 
                  key={link}
                >
                  <Link 
                    to={`/${link.toLowerCase().replace(' ', '')}`} 
                    className="text-gray-400 hover:text-white hover:pl-2 transition-all duration-300 block"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Courses */}
          <div
          >
            <h3 className="text-lg font-semibold mb-4">Popular Courses</h3>
            <ul className="space-y-2">
              {['Academics', 'Intermediate', 'Bachelor\'s Degree', 'Master\'s Degree', 'Competition'].map((course, index) => (
                <li 
                  key={course}
                >
                  <a 
                    href="#" 
                    className="text-gray-400 hover:text-white hover:pl-2 transition-all duration-300 block"
                  >
                    {course}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div
          >
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-2 text-gray-400">
              <li
              >
                NH-33 Ramanagar, Near CN College, Marar
              </li>
              <li
              >
                Ramgarh, JH 829117
              </li>
              <li
              >
                Mobile: +91 9934522519, 8226871287
              </li>
              <li
              >
                Email: Sharmainstitute@gmail.com
              </li>
            </ul>
          </div>
        </div>

        <div 
          className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400"
        >
          <p>&copy; {new Date().getFullYear()} Sharma Institute Pvt. Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer