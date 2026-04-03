// src/components/home/Stats.jsx
import React from 'react'

const Stats = () => {
  const stats = [
    { number: '1,000+', label: 'Successful Students' },
    { number: '98%', label: 'Success Rate' },
    { number: '100+', label: 'Enrolled Per Session' },
    { number: '30+', label: 'Years Experience' }
  ]

  return (
    <section 
      className="py-16 bg-gradient-to-b from-red-50 to-purple-50"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
          >
            Our Achievement in Numbers
          </h2>
          <p 
            className="text-gray-600 max-w-2xl mx-auto"
          >
            Join hundreds of students who have achieved their dreams with our guidance.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200"
            >
              <div 
                className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-600 to-purple-900 bg-clip-text text-transparent mb-2"
              >
                {stat.number}
              </div>
              <div className="text-gray-700 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        <div 
          className="mt-12 text-center"
        >
          <div className="inline-block bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-full px-6 py-3 shadow-md hover:shadow-lg transition-shadow duration-300">
            <span className="text-green-700 font-medium flex items-center justify-center">
              <span 
                className="text-xl mr-2"
              >
                🏆
              </span>
              Ranked #1 Coaching Institute in Local for years
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Stats