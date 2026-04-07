// src/components/home/HeroSection.jsx
import React from 'react'
import { Link } from 'react-router-dom'

const HeroSection = () => {
  return (
    <section 
      className="bg-gradient-to-r from-red-700 to-purple-800 text-white relative overflow-hidden min-h-[600px]"
    >
      {/* Animated Background Particles */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>
      
      <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left Side - Text Content */}
          <div className="flex-1 max-w-3xl">
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            >
              Excel in Your Academic Journey with Expert Guidance
            </h1>
            
            <p 
              className="text-xl mb-8 text-red-100"
            >
              Join Ramgarh's premier coaching institute for Academics, Bachelors Degree (For Commerce and Arts), JPSC, and board exams. 
              Proven track record of success with 1,000+ selections.
            </p>
            
            <div 
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link 
                to="/signup" 
                className="bg-gradient-to-r from-red-600 to-purple-700 text-white hover:from-red-700 hover:to-purple-800 hover:shadow-xl hover:scale-105 transition-all duration-300 text-center py-3 px-8 rounded-xl font-bold text-lg"
              >
                Start Free Trial
              </Link>
              <Link 
                to="/courses" 
                className="bg-gradient-to-r from-red-100 to-purple-100 text-red-800 hover:text-red-900 hover:from-red-200 hover:to-purple-200 hover:shadow-lg hover:scale-105 border border-red-200 transition-all duration-300 text-center py-3 px-8 rounded-xl font-bold text-lg"
              >
                Explore Courses
              </Link>
            </div>
          </div>

          {/* Right Side - Admission Card Image */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <div className="relative group w-full max-w-lg md:max-w-xl lg:max-w-2xl">
              {/* Glow Effect */}
              <div className="absolute -inset-2 bg-gradient-to-r from-red-500 to-purple-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition duration-300"></div>
              
              {/* Image Card - Removed white background */}
              <div className="relative rounded-2xl overflow-hidden shadow-xl transform transition-all duration-300 group-hover:scale-105">
                <img 
                  src="/Images/slide6.jpeg" 
                  alt="Admission Open - Sharma Institute"
                  className="w-full h-auto object-cover"
                  style={{ display: 'block' }}
                />
                {/* Overlay to match color scheme */}
                <div className="absolute inset-0 bg-gradient-to-t from-red-900/30 to-purple-900/20 pointer-events-none"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection