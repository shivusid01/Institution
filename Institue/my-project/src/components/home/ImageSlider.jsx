// src/components/home/ImageSlider.jsx (With Top Text)
import React, { useState, useEffect } from 'react'

const ImageSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const images = [
    {
      id: 1,
      src: "/Images/slide1.jpeg",
      alt: "Academic Classes Excellence"
    },
    {
      id: 2,
      src: "/Images/slide2.jpeg",
      alt: "Admission Open"
    },
    {
      id: 3,
      src: "/Images/slide3.jpeg",
      alt: "CBSE & JAC Board"
    },
    {
      id: 4,
      src: "/Images/slide4.jpeg",
      alt: "Expert Faculty"
    },
    {
      id: 5,
      src: "/Images/slide5.jpeg",
      alt: "Success Stories"
    },
    {
      id: 6,
      src: "/Images/slide6.jpeg",
      alt: "Limited Seats"
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [images.length])

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length)
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
  }

  const goToSlide = (index) => {
    setCurrentIndex(index)
  }

  return (
    <div className="relative w-full pt-4 md:pt-6">
      {/* Top Text */}
      <div className="text-center mb-4">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent">
          📸 Our Moments & Memories
        </h2>
        <p className="text-sm md:text-base text-gray-600 mt-1">Glimpses of our journey</p>
      </div>

      {/* Main Image Container */}
      <div className="relative overflow-hidden rounded-lg shadow-md">
        <div className="relative w-full pt-[30%] md:pt-[25%] lg:pt-[30%]">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
                index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/800/ff6b6b/ffffff?text=Institute"
                }}
              />
              
              {/* Image Caption Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <p className="text-white text-sm md:text-base font-semibold text-center">
                  {image.alt}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-all duration-200 hover:scale-110 z-20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-all duration-200 hover:scale-110 z-20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-3">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex
                ? 'w-5 h-1.5 bg-gradient-to-r from-red-500 to-purple-600'
                : 'w-1.5 h-1.5 bg-gray-400 hover:bg-gray-500'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export default ImageSlider