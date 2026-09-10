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
    const { classId, topic, description, className } = req.body;

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

    // For classId validation - it might be a simple string ID or MongoDB ObjectId
    let classData = null;
    let finalClassName = className || classId;

    // Try to find class in database if classId looks like a MongoDB ObjectId
    if (classId.match(/^[0-9a-fA-F]{24}$/)) {
      classData = await Class.findById(classId);
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
      finalClassName = classData.title;
    } else {
      // For string IDs like "class1", "class12_science", etc., we'll use the className from request
      finalClassName = className || classId;
    }

    // Create document record
    const document = new Document({
      title: req.file.originalname.replace(/\.[^/.]+$/, ''), // Remove file extension for title
      description: description || '',
      classId: classId, // Store the ID as-is (might be MongoDB ObjectId or string ID)
      className: finalClassName,
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

const generatePDFBuffer = (title, className, topic, description) => {
  const safeTitle = (title || 'Study Material').replace(/[()\\]/g, '');
  const safeClass = (className || 'General Class').replace(/[()\\]/g, '');
  const safeTopic = (topic || 'General Topic').replace(/[()\\]/g, '');
  const safeDesc = (description || 'Sharma Institute Study Material Document').replace(/[()\\]/g, '').slice(0, 150);

  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 400 >>
stream
BT
/F1 18 Tf
50 720 Td
(SHARMA INSTITUTE - STUDY MATERIAL) Tj
/F1 12 Tf
0 -35 Td
(Document Title: ${safeTitle}) Tj
0 -25 Td
(Class: ${safeClass}) Tj
0 -25 Td
(Topic: ${safeTopic}) Tj
0 -35 Td
(Description: ${safeDesc}) Tj
0 -50 Td
(Official Study Material - Sharma Institute) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000450 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
530
%%EOF`;
  return Buffer.from(pdfContent, 'binary');
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

    // Construct file path with multiple fallback attempts
    let filePath = path.join(__dirname, '..', document.fileUrl);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, '../uploads/documents', document.fileName);
    }
    if (!fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), document.fileUrl);
    }
    if (!fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), 'uploads/documents', document.fileName);
    }

    // If file is missing on Render disk, serve fallback PDF buffer
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Physical PDF File missing on server disk (Render Ephemeral Storage). Generating PDF response for ${document.title}...`);
      const downloadName = (document.fileName || `${document.title || 'document'}.pdf`).endsWith('.pdf')
        ? (document.fileName || `${document.title || 'document'}.pdf`)
        : `${document.title || 'document'}.pdf`;
      
      const pdfBuffer = generatePDFBuffer(document.title, document.className, document.topic, document.description);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
      return res.send(pdfBuffer);
    }

    // Send physical file with friendly name
    const downloadName = document.fileName || `${document.title || 'document'}.pdf`;
    res.download(filePath, downloadName);
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
