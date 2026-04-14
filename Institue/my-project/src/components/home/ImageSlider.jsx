// src/components/home/ImageSlider.jsx
import React, { useState, useEffect } from 'react'

const ImageSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const images = [
    { id: 1, src: "/Images/slide1.jpeg", alt: "Academic Classes Excellence" },
    { id: 2, src: "/Images/image.png", alt: "Admission Open" },
    { id: 3, src: "/Images/slide3.jpeg", alt: "CBSE & JAC Board" },
    { id: 4, src: "/Images/slide4.jpeg", alt: "Expert Faculty" },
    { id: 5, src: "/Images/slide5.jpeg", alt: "Success Stories" },
    { id: 6, src: "/Images/slide6.jpeg", alt: "Limited Seats" }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 2500)

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
    <div className="w-full m-0 p-0">
      
      {/* IMAGE SLIDER (NO GAP) */}
      <div className="relative overflow-hidden shadow-lg">
        
        <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px]">
          
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${
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

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/30"></div>

              {/* Caption */}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <p className="text-white text-lg md:text-xl font-semibold">
                  {image.alt}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 z-20"
        >
          ‹
        </button>

        <button
          onClick={goToNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 z-20"
        >
          ›
        </button>
      </div>

      {/* MOVING TEXT STRIP (MARQUEE STYLE) */}
      <div className="bg-gradient-to-r from-red-600 to-purple-800 text-white py-2 overflow-hidden">
        <div className="whitespace-nowrap animate-marquee text-sm md:text-base font-medium">
          🎓 Admissions Open 2026 &nbsp;&nbsp; | &nbsp;&nbsp;
          📚 CBSE & JAC Board तैयारी &nbsp;&nbsp; | &nbsp;&nbsp;
          🏆 1000+ Successful Students &nbsp;&nbsp; | &nbsp;&nbsp;
          👨‍🏫 Expert Faculty Available &nbsp;&nbsp; | &nbsp;&nbsp;
          ⚡ Limited Seats – Enroll Now!
        </div>
      </div>

      {/* DOTS */}
      <div className="flex justify-center gap-2 mt-3">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex
                ? 'w-5 h-1.5 bg-gradient-to-r from-red-500 to-purple-600'
                : 'w-1.5 h-1.5 bg-gray-400'
            }`}
          />
        ))}
      </div>

    </div>
  )
}

export default ImageSlider