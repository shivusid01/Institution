const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  uploadDocument,
  getAllDocuments,
  getDocumentsByClass,
  downloadDocument,
  updateDocument,
  deleteDocument,
  getDocumentById
} = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Multer configuration for document uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/documents/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Only allow PDF files
  if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Routes
// Post - Upload document (Admin/Teacher only)
router.post('/upload', protect, authorize('admin', 'teacher'), upload.single('file'), uploadDocument);

// Get - All documents
router.get('/', protect, getAllDocuments);

// Get - Documents by class
router.get('/class/:classId', protect, getDocumentsByClass);

// Get - Single document by ID
router.get('/:documentId', protect, getDocumentById);

// Download document
router.get('/download/:documentId', protect, downloadDocument);

// Put - Update document (Admin/Author only)
router.put('/:documentId', protect, updateDocument);

// Delete - Delete document (Admin/Author only)
router.delete('/:documentId', protect, deleteDocument);

module.exports = router;
