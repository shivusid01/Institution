const express = require('express');
const router = express.Router();
const {
  createClass,
  getAllClasses,
  getUpcomingClasses,
  getLiveClasses,
  joinClass,
  deleteClass,
  updateClassStatuses,
  cleanupOldClasses,
  getClassStats
} = require('../controllers/classController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public routes (no auth required)
router.get('/upcoming', getUpcomingClasses);
router.get('/live', getLiveClasses);

// All routes below this are protected
router.use(protect);

// Student routes
router.get('/', getAllClasses);
router.post('/:id/join', authorize('student'), joinClass);

// Admin routes
router.post('/', authorize('admin'), createClass);
router.delete('/:id', authorize('admin'), deleteClass);
router.post('/update-statuses', authorize('admin'), updateClassStatuses);
router.delete('/cleanup/old', authorize('admin'), cleanupOldClasses);
router.get('/stats/dashboard', authorize('admin'), getClassStats);

module.exports = router;