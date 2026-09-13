import React from 'react'

export const DEFAULT_STUDENT_CLASSES = [
  // School Level (Class 1-8)
  { id: 'Class 1', name: 'Class 1', category: 'School Level (Class 1-8)' },
  { id: 'Class 2', name: 'Class 2', category: 'School Level (Class 1-8)' },
  { id: 'Class 3', name: 'Class 3', category: 'School Level (Class 1-8)' },
  { id: 'Class 4', name: 'Class 4', category: 'School Level (Class 1-8)' },
  { id: 'Class 5', name: 'Class 5', category: 'School Level (Class 1-8)' },
  { id: 'Class 6', name: 'Class 6', category: 'School Level (Class 1-8)' },
  { id: 'Class 7', name: 'Class 7', category: 'School Level (Class 1-8)' },
  { id: 'Class 8', name: 'Class 8', category: 'School Level (Class 1-8)' },
  { id: 'Academic (Class 1-8)', name: 'Academic (Class 1-8)', category: 'School Level (Class 1-8)' },

  // Foundation (Class 9-10)
  { id: 'Class 9', name: 'Class 9', category: 'Foundation (Class 9-10)' },
  { id: 'Class 10', name: 'Class 10', category: 'Foundation (Class 9-10)' },
  { id: 'Foundation (Class 9-10)', name: 'Foundation (Class 9-10)', category: 'Foundation (Class 9-10)' },

  // Commerce (Class 11-12)
  { id: 'Class 11 (Commerce)', name: 'Class 11 (Commerce)', category: 'Commerce (Class 11-12)' },
  { id: 'Class 12 (Commerce)', name: 'Class 12 (Commerce)', category: 'Commerce (Class 11-12)' },
  { id: 'CBSE 11-12 (Commerce)', name: 'CBSE 11-12 (Commerce)', category: 'Commerce (Class 11-12)' },
  { id: 'State Board 11-12 (Commerce)', name: 'State Board 11-12 (Commerce)', category: 'Commerce (Class 11-12)' },

  // B.COM
  { id: 'B.COM 1st Year', name: 'B.COM 1st Year', category: 'B.COM' },
  { id: 'B.COM 2nd Year', name: 'B.COM 2nd Year', category: 'B.COM' },
  { id: 'B.COM 3rd Year', name: 'B.COM 3rd Year', category: 'B.COM' },

  // M.COM
  { id: 'M.COM 1st Year', name: 'M.COM 1st Year', category: 'M.COM' },
  { id: 'M.COM 2nd Year', name: 'M.COM 2nd Year', category: 'M.COM' },

  // Competition
  { id: 'Competition Exams', name: 'Competition Exams', category: 'Competition' },

  // General
  { id: 'DATA ANALYTICS', name: 'DATA ANALYTICS', category: 'General' }
]

export const CATEGORY_ORDER = [
  'School Level (Class 1-8)',
  'Foundation (Class 9-10)',
  'Commerce (Class 11-12)',
  'B.COM',
  'M.COM',
  'Competition',
  'General'
]

export const getGroupedClassOptions = (extraCourses = []) => {
  const classMap = new Map()

  // 1. Populate default classes
  DEFAULT_STUDENT_CLASSES.forEach(cls => {
    classMap.set(cls.name.toLowerCase(), { ...cls })
  })

  // 2. Merge extra dynamic courses from backend if present
  if (Array.isArray(extraCourses)) {
    extraCourses.forEach(course => {
      const courseName = typeof course === 'string' ? course : (course?.name || course?.title || course?.id)
      if (!courseName) return

      const key = courseName.toLowerCase().trim()
      if (key === 'b.com' || key === 'bcom' || key === 'm.com' || key === 'mcom') return;

      if (!classMap.has(key)) {
        let category = (typeof course === 'object' && course?.category) ? course.category : 'General'

        if (key.includes('b.com') || key.includes('bcom')) {
          category = 'B.COM'
        } else if (key.includes('m.com') || key.includes('mcom')) {
          category = 'M.COM'
        } else if (key.includes('11') || key.includes('12') || key.includes('commerce')) {
          category = 'Commerce (Class 11-12)'
        } else if (key.includes('9') || key.includes('10') || key.includes('foundation')) {
          category = 'Foundation (Class 9-10)'
        } else if (key.includes('class 1') || key.includes('class 2') || key.includes('class 3') || key.includes('class 4') || key.includes('class 5') || key.includes('class 6') || key.includes('class 7') || key.includes('class 8')) {
          category = 'School Level (Class 1-8)'
        }

        classMap.set(key, {
          id: courseName,
          name: courseName,
          category: category
        })
      }
    })
  }

  const allItems = Array.from(classMap.values())
  const grouped = {}

  // Initialize keys in CATEGORY_ORDER
  CATEGORY_ORDER.forEach(cat => {
    grouped[cat] = []
  })

  allItems.forEach(item => {
    const cat = item.category || 'General'
    if (!grouped[cat]) {
      grouped[cat] = []
    }
    grouped[cat].push(item)
  })

  return grouped
}

export const renderGroupedClassOptions = (extraCourses = []) => {
  const grouped = getGroupedClassOptions(extraCourses)
  return Object.entries(grouped).map(([category, items]) => {
    if (!items || items.length === 0) return null
    return (
      <optgroup key={category} label={category}>
        {items.map(cls => (
          <option key={cls.id || cls.name} value={cls.id || cls.name}>
            {cls.name || cls.id}
          </option>
        ))}
      </optgroup>
    )
  })
}
