// src/components/home/MovingTextStrip.jsx
import React from 'react'

const MovingTextStrip = () => {
  const text = "🏆 Excellence for Class 1st to 10th (CBSE & JAC Board)     📢 ADMISSION OPEN 2026-27     🎯 Limited Seats Available - Enroll Now!     "

  return (
    <div className="w-full overflow-hidden bg-gradient-to-r from-red-600 to-purple-800">
      <div className="moving-text-container w-full h-10 md:h-12 overflow-hidden relative">
        <div className="moving-text absolute whitespace-nowrap flex items-center h-full">
          <span className="text-sm md:text-base lg:text-lg font-bold text-white mx-4">
            {text}
          </span>
          <span className="text-sm md:text-base lg:text-lg font-bold text-white mx-4">
            {text}
          </span>
          <span className="text-sm md:text-base lg:text-lg font-bold text-white mx-4">
            {text}
          </span>
        </div>
      </div>

      <style jsx>{`
        .moving-text {
          animation: moveText 20s linear infinite;
          width: max-content;
        }
        
        @keyframes moveText {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .moving-text:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}

export default MovingTextStrip