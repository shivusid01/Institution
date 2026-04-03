// src/components/home/Features.jsx
import React from 'react'

const Features = () => {
  const features = [
    {
      icon: '🎯',
      title: 'Expert Faculty',
      description: 'NTA UGC NET Cleared with 10+ years of teaching experience.'
    },
    {
      icon: '📚',
      title: 'Comprehensive Study Material',
      description: 'Curated notes, practice papers, and mock tests updated regularly.'
    },
    {
      icon: '💻',
      title: 'Live Interactive Classes',
      description: 'Real-time doubt solving and interactive sessions with teachers.'
    },
    {
      icon: '📊',
      title: 'Performance Analytics',
      description: 'Detailed progress reports and personalized feedback.'
    },
    {
      icon: '🏆',
      title: 'Proven Success Rate',
      description: 'Consistent top ranks in State Boards and CBSE board exams.'
    },
    {
      icon: '📱',
      title: 'Mobile Learning',
      description: 'Learn anytime, anywhere with our mobile app and recorded lectures (Soon*).'
    }
  ]

  return (
    <section 
      className="py-16 bg-white"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
          >
            Why Choose Sharma Institute?
          </h2>
          <p 
            className="text-gray-600 max-w-2xl mx-auto"
          >
            We combine quality education with innovative technology to deliver exceptional results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="card hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-red-200 bg-gradient-to-b from-white to-gray-50"
            >
              <div className="flex flex-col items-center text-center p-6">
                <div 
                  className="text-4xl mb-4"
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 hover:bg-gradient-to-r hover:from-red-600 hover:to-purple-900 hover:bg-clip-text hover:text-transparent transition-all duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features