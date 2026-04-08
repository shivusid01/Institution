const Document = require('../models/Document');
const Class = require('../models/Class');
const fs = require('fs');
const path = require('path');

// Ensure uploads/documents directory exists
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDirectoryExists(path.join(__dirname, '../uploads/documents'));

// @desc    Upload a document
// @route   POST /api/documents/upload
// @access  Private (Admin/Teacher)
exports.uploadDocument = async (req, res) => {
  try {
    const { classId, topic, description } = req.body;

    // Validate required fields
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    if (!classId || !topic) {
      return res.status(400).json({
        success: false,
        message: 'Please provide classId and topic'
      });
    }

    // Check if class exists
    const classData = await Class.findById(classId);
    if (!classData) {
      // Delete uploaded file if class doesn't exist
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Create document record
    const document = new Document({
      title: req.file.originalname.replace(/\.[^/.]+$/, ''), // Remove file extension for title
      description: description || '',
      classId: classId,
      className: classData.title,
      topic: topic,
      fileUrl: `/uploads/documents/${req.file.filename}`,
      fileName: req.file.filename,
      uploadedBy: req.user._id,
      uploadedByName: req.user.name,
      fileSize: req.file.size
    });

    await document.save();

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document
    });
  } catch (error) {
    // Delete uploaded file if error occurs
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Error uploading document',
      error: error.message
    });
  }
};

// @desc    Get all documents (with filters)
// @route   GET /api/documents
// @access  Private (Admin/Student/Teacher)
exports.getAllDocuments = async (req, res) => {
  try {
    const { classId, topic, sortBy } = req.query;
    let filter = { isActive: true };

    // Apply filters
    if (classId) {
      filter.classId = classId;
    }
    if (topic) {
      filter.topic = new RegExp(topic, 'i'); // Case-insensitive search
    }

    // Build query
    let query = Document.find(filter).populate('uploadedBy', 'name email');

    // Apply sorting
    if (sortBy === 'latest') {
      query = query.sort({ createdAt: -1 });
    } else if (sortBy === 'oldest') {
      query = query.sort({ createdAt: 1 });
    } else if (sortBy === 'popular') {
      query = query.sort({ downloads: -1 });
    } else {
      query = query.sort({ createdAt: -1 }); // Default sort
    }

    const documents = await query;

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching documents',
      error: error.message
    });
  }
};

// @desc    Get documents by class
// @route   GET /api/documents/class/:classId
// @access  Private
exports.getDocumentsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { topic } = req.query;

    let filter = { classId: classId, isActive: true };

    if (topic) {
      filter.topic = new RegExp(topic, 'i');
    }

    const documents = await Document.find(filter)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching documents',
      error: error.message
    });
  }
};

// @desc    Download document
// @route   GET /api/documents/download/:documentId
// @access  Private
exports.downloadDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Increment download count
    document.downloads += 1;
    await document.save();

    // Construct file path
    const filePath = path.join(__dirname, '..', document.fileUrl);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Send file
    res.download(filePath, document.fileName);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error downloading document',
      error: error.message
    });
  }
};

// @desc    Update document
// @route   PUT /api/documents/:documentId
// @access  Private (Admin/Author)
exports.updateDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { title, description, topic } = req.body;

    let document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check authorization (only admin or original uploader can edit)
    if (document.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this document'
      });
    }

    // Update fields
    if (title) document.title = title;
    if (description !== undefined) document.description = description;
    if (topic) document.topic = topic;

    await document.save();

    res.status(200).json({
      success: true,
      message: 'Document updated successfully',
      data: document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating document',
      error: error.message
    });
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:documentId
// @access  Private (Admin/Author)
exports.deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check authorization
    if (document.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this document'
      });
    }

    // Delete file from server
    const filePath = path.join(__dirname, '..', document.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete document from database
    await Document.findByIdAndDelete(documentId);

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting document',
      error: error.message
    });
  }
};

// @desc    Get document by ID
// @route   GET /api/documents/:documentId
// @access  Private
exports.getDocumentById = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId)
      .populate('uploadedBy', 'name email')
      .populate('classId', 'title');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching document',
      error: error.message
    });
  }
};
