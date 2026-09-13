const Document = require('../models/Document');
const Class = require('../models/Class');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Ensure uploads/documents directory exists
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDirectoryExists(path.join(__dirname, '../uploads/documents'));

// GridFS Upload Helper
const uploadToGridFS = (filePath, fileName) => {
  return new Promise((resolve, reject) => {
    try {
      if (!mongoose.connection || mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
        return resolve(null);
      }
      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'documents'
      });
      const uploadStream = bucket.openUploadStream(fileName, {
        contentType: 'application/pdf'
      });
      const readStream = fs.createReadStream(filePath);
      readStream.pipe(uploadStream);

      uploadStream.on('finish', () => {
        resolve(uploadStream.id);
      });
      uploadStream.on('error', (err) => {
        console.error('GridFS Upload Error:', err);
        resolve(null);
      });
    } catch (err) {
      console.error('GridFS Upload Exception:', err);
      resolve(null);
    }
  });
};

// Sync existing disk files to GridFS on database connect
exports.syncExistingFilesToGridFS = async () => {
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1 || !mongoose.connection.db) return;
    const documents = await Document.find({});
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'documents'
    });

    for (const doc of documents) {
      if (!doc.fileName) continue;
      let filePath = path.join(__dirname, '../uploads/documents', doc.fileName);
      if (!fs.existsSync(filePath)) {
        filePath = path.join(__dirname, '..', doc.fileUrl);
      }

      if (fs.existsSync(filePath)) {
        const gridFiles = await bucket.find({ filename: doc.fileName }).toArray();
        if (gridFiles.length === 0) {
          console.log(`📤 Backing up document to GridFS: ${doc.title} (${doc.fileName})...`);
          const gridFsId = await uploadToGridFS(filePath, doc.fileName);
          if (gridFsId) {
            doc.gridFsId = gridFsId;
            await doc.save();
            console.log(`✅ Saved GridFS ID for ${doc.title}`);
          }
        } else if (!doc.gridFsId) {
          doc.gridFsId = gridFiles[0]._id;
          await doc.save();
        }
      }
    }
  } catch (err) {
    console.error('Error syncing existing files to GridFS:', err);
  }
};

// @desc    Upload a document
// @route   POST /api/documents/upload
// @access  Private (Admin/Teacher)
exports.uploadDocument = async (req, res) => {
  try {
    const { classId, topic, description, className, category } = req.body;

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

    // Upload to GridFS for permanent storage
    let gridFsId = null;
    if (req.file && req.file.path) {
      gridFsId = await uploadToGridFS(req.file.path, req.file.filename);
    }

    // Create document record
    const document = new Document({
      title: req.file.originalname.replace(/\.[^/.]+$/, ''), // Remove file extension for title
      description: description || '',
      classId: classId, // Store the ID as-is (might be MongoDB ObjectId or string ID)
      className: finalClassName,
      topic: topic,
      category: category || 'Study Material',
      fileUrl: `/uploads/documents/${req.file.filename}`,
      fileName: req.file.filename,
      gridFsId: gridFsId,
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
    const { classId, topic, category, sortBy } = req.query;
    let filter = { isActive: true };

    if (category && category !== 'all') {
      filter.category = category;
    }

    // Apply class filters
    if (classId) {
      filter.classId = classId;
    } else if (req.user && req.user.role === 'student') {
      // For students without explicit classId filter, restrict documents to student's enrolled class/course ONLY!
      let studentClasses = [];
      if (req.user.class) studentClasses.push(req.user.class);
      if (req.user.course) studentClasses.push(req.user.course);

      if (req.user.courseRef) {
        try {
          const Course = require('../models/Course');
          const courseObj = await Course.findById(req.user.courseRef);
          if (courseObj && courseObj.name) {
            studentClasses.push(courseObj.name);
          }
        } catch (e) {
          console.error('Error finding student courseRef:', e);
        }
      }

      // Expand class variants (e.g. "B.COM 3rd Year" <-> "B.COM")
      const expandClassVariants = (classList) => {
        const expanded = new Set();
        classList.forEach(cls => {
          if (!cls) return;
          const cleanCls = cls.trim();
          expanded.add(cleanCls);
          const lower = cleanCls.toLowerCase();

          if (lower.includes('b.com') || lower.includes('bcom')) {
            expanded.add('B.COM');
            expanded.add('B.COM 1st Year');
            expanded.add('B.COM 2nd Year');
            expanded.add('B.COM 3rd Year');
          }
          if (lower.includes('m.com') || lower.includes('mcom')) {
            expanded.add('M.COM');
            expanded.add('M.COM 1st Year');
            expanded.add('M.COM 2nd Year');
          }
          if (lower.includes('11') && lower.includes('commerce')) {
            expanded.add('Class 11 (Commerce)');
            expanded.add('Class 11 (State Board Commerce)');
            expanded.add('11 Commerce');
          }
          if (lower.includes('12') && lower.includes('commerce')) {
            expanded.add('Class 12 (Commerce)');
            expanded.add('Class 12 (State Board Commerce)');
            expanded.add('12 Commerce');
          }
          if (lower.includes('state board')) {
            expanded.add('State Board');
            expanded.add('Class 11 (State Board Commerce)');
            expanded.add('Class 12 (State Board Commerce)');
            expanded.add('11 Commerce');
            expanded.add('12 Commerce');
          }
          if (lower.includes('academic') || (lower.includes('class') && /[1-8]/.test(lower))) {
            ['1','2','3','4','5','6','7','8'].forEach(num => expanded.add(`Class ${num}`));
          }
          if (lower.includes('foundation') || lower.includes('class 9') || lower.includes('class 10')) {
            expanded.add('Class 9');
            expanded.add('Class 10');
          }
        });
        return Array.from(expanded);
      };

      studentClasses = expandClassVariants(studentClasses);

      if (studentClasses.length > 0) {
        const escapeRegex = (string) => string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regexes = studentClasses.map(cls => new RegExp('^' + escapeRegex(cls) + '$', 'i'));

        filter.$or = [
          { classId: { $in: studentClasses } },
          { className: { $in: studentClasses } },
          ...regexes.map(r => ({ classId: r })),
          ...regexes.map(r => ({ className: r }))
        ];
      }
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

    const fileExt = path.extname(document.fileName || document.fileUrl || '') || '';
    const downloadName = document.fileName || (fileExt ? `${document.title || 'document'}${fileExt}` : `${document.title || 'document'}.pdf`);

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

    // 1. Send physical file if present on local disk
    if (fs.existsSync(filePath)) {
      if (req.query.inline === 'true' || req.query.view === 'true') {
        return res.sendFile(filePath);
      }
      return res.download(filePath, downloadName);
    }

    // 2. If physical file missing from local disk (e.g. Render ephemeral restart), stream from MongoDB GridFS
    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.connection.db) {
      try {
        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
          bucketName: 'documents'
        });

        let gridFiles = [];
        if (document.gridFsId) {
          gridFiles = await bucket.find({ _id: document.gridFsId }).toArray();
        }
        if (gridFiles.length === 0 && document.fileName) {
          gridFiles = await bucket.find({ filename: document.fileName }).toArray();
        }

        if (gridFiles.length > 0) {
          console.log(`📡 Streaming document "${document.title}" from MongoDB GridFS bucket...`);
          const isInline = req.query.inline === 'true' || req.query.view === 'true';
          res.setHeader('Content-Type', gridFiles[0].contentType || 'application/pdf');
          res.setHeader('Content-Disposition', isInline ? `inline; filename="${encodeURIComponent(downloadName)}"` : `attachment; filename="${encodeURIComponent(downloadName)}"`);

          const targetGridFile = gridFiles[0];
          const downloadStream = bucket.openDownloadStream(targetGridFile._id);

          // Recreate local file cache
          try {
            const cacheDir = path.join(__dirname, '../uploads/documents');
            ensureDirectoryExists(cacheDir);
            const cachePath = path.join(cacheDir, document.fileName);
            const writeCacheStream = fs.createWriteStream(cachePath);
            downloadStream.pipe(writeCacheStream).on('error', (err) => console.error('Disk cache write error:', err));
          } catch (cacheErr) {
            console.error('Cache creation error:', cacheErr);
          }

          return downloadStream.pipe(res);
        }
      } catch (gridErr) {
        console.error('GridFS download stream error:', gridErr);
      }
    }

    // 3. Serve generated PDF response only if file is missing completely
    console.warn(`⚠️ Physical PDF File missing on server disk and GridFS. Generating PDF response for ${document.title}...`);
    const pdfBuffer = generatePDFBuffer(document.title, document.className, document.topic, document.description);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    return res.send(pdfBuffer);
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

// @desc    View document inline (without triggering download)
// @route   GET /api/documents/view/:documentId
// @access  Public / Private
exports.viewDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const fileExt = path.extname(document.fileName || document.fileUrl || '').toLowerCase() || '.pdf';
    let contentType = 'application/pdf';
    if (fileExt === '.jpg' || fileExt === '.jpeg') contentType = 'image/jpeg';
    else if (fileExt === '.png') contentType = 'image/png';
    else if (fileExt === '.gif') contentType = 'image/gif';
    else if (fileExt === '.txt') contentType = 'text/plain';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');

    // Construct file path
    let filePath = path.join(__dirname, '..', document.fileUrl);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, '../uploads/documents', document.fileName);
    }

    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }

    // GridFS stream inline fallback
    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.connection.db) {
      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'documents'
      });

      let gridFiles = [];
      if (document.gridFsId) {
        gridFiles = await bucket.find({ _id: document.gridFsId }).toArray();
      }
      if (gridFiles.length === 0 && document.fileName) {
        gridFiles = await bucket.find({ filename: document.fileName }).toArray();
      }

      if (gridFiles.length > 0) {
        res.setHeader('Content-Type', gridFiles[0].contentType || contentType);
        res.setHeader('Content-Disposition', 'inline');
        return bucket.openDownloadStream(gridFiles[0]._id).pipe(res);
      }
    }

    // PDF fallback buffer
    const pdfBuffer = generatePDFBuffer(document.title, document.className, document.topic, document.description);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    return res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error viewing document',
      error: error.message
    });
  }
};
