// backend/routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  getCourseStats
} = require('../controllers/courseController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public routes
router.get('/', getAllCourses);
router.get('/:id', getCourse);

// Protected routes
router.use(protect);

// Student routes
router.post('/:id/enroll', authorize('student'), enrollCourse);

// Admin routes
router.post('/', authorize('admin'), createCourse);
router.put('/:id', authorize('admin'), updateCourse);
router.delete('/:id', authorize('admin'), deleteCourse);
router.get('/stats/dashboard', authorize('admin'), getCourseStats);
const multer = require('multer');
const path = require('path');

// Multer configuration for syllabus PDF uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/syllabus/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'syllabus-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Admin syllabus upload route
router.post('/upload-syllabus', protect, authorize('admin'), upload.single('syllabus'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file provided'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Syllabus PDF uploaded successfully',
      fileUrl: `/uploads/syllabus/${req.file.filename}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during syllabus upload',
      error: error.message
    });
  }
});

module.exports = router;