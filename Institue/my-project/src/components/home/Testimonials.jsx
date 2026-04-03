// src/components/home/Testimonials.jsx
import React from 'react'

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Riyan Shrivastava',
      course: 'Intermediate',
      avatar: 'RS',
      text: 'Sharma Institute stands out as an exeptional coaching center, offering a unique one-on-one mentoring approach that truly caters to individual students needs!',
      rating: 5
    },
    {
      name: 'Ajay Sharma',
      course: 'Graduation',
      avatar: 'AS',
      text: 'The personalized attention and doubt-solving sessions were game-changers for my B.com preparation.',
      rating: 5
    },
    {
      name: 'Anish Kumar',
      course: 'SSC GD',
      avatar: 'AK',
      text: 'Comprehensive coverage of current affairs and excellent mentorship helped me in prepration of my SSC GD Exam.',
      rating: 5
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
            What Our Students Say
          </h2>
          <p 
            className="text-gray-600 max-w-2xl mx-auto"
          >
            Hear from our successful students who achieved their dreams with our guidance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="card hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-red-200 bg-gradient-to-b from-white to-gray-50"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div 
                    className="h-12 w-12 rounded-full bg-gradient-to-r from-red-100 to-purple-100 flex items-center justify-center mr-4 shadow-md"
                  >
                    <span className="font-bold bg-gradient-to-r from-red-600 to-purple-900 bg-clip-text text-transparent">
                      {testimonial.avatar}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.course}</p>
                  </div>
                </div>
                
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span 
                      key={i} 
                      className="text-yellow-400 text-xl"
                    >
                      ★
                    </span>
                  ))}
                </div>
                
                <p className="text-gray-700 italic">"{testimonial.text}"</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials