// backend/routes/memberRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember
} = require('../controllers/memberController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All member routes require Admin authentication
router.use(protect, authorize('admin'));

router.route('/')
  .get(getAllMembers)
  .post(createMember);

router.route('/:id')
  .get(getMemberById)
  .put(updateMember)
  .delete(deleteMember);

module.exports = router;
