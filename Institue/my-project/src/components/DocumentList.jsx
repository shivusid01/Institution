import React, { useState, useEffect, useRef } from 'react'
import { documentAPI, courseAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { DEFAULT_STUDENT_CLASSES, renderGroupedClassOptions } from '../constants/classData'

const PdfCanvasViewer = ({ arrayBuffer }) => {
  const [numPages, setNumPages] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.2)
  const [pdfDoc, setPdfDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const canvasRef = useRef(null)

  useEffect(() => {
    let isMounted = true
    const initPdf = async () => {
      try {
        setLoading(true)
        setError('')
        
        // Load PDF.js script dynamically if not loaded
        if (!window.pdfjsLib) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
            script.onload = () => {
              if (window.pdfjsLib) {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
                resolve()
              } else {
                reject(new Error('PDF.js failed to initialize'))
              }
            }
            script.onerror = reject
            document.body.appendChild(script)
          })
        }

        const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer })
        const pdf = await loadingTask.promise
        if (isMounted) {
          setPdfDoc(pdf)
          setNumPages(pdf.numPages)
          setPageNumber(1)
          setLoading(false)
        }
      } catch (err) {
        console.error('PDF.js render error:', err)
        if (isMounted) {
          setError('Unable to parse PDF content.')
          setLoading(false)
        }
      }
    }

    if (arrayBuffer) {
      initPdf()
    }

    return () => {
      isMounted = false
    }
  }, [arrayBuffer])

  useEffect(() => {
    let renderTask = null
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return
      try {
        const page = await pdfDoc.getPage(pageNumber)
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        const viewport = page.getViewport({ scale })
        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        }
        renderTask = page.render(renderContext)
        await renderTask.promise
      } catch (err) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('Page render error:', err)
        }
      }
    }

    renderPage()
  }, [pdfDoc, pageNumber, scale])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400 mb-4"></div>
        <p className="font-medium text-gray-200">Rendering document on HTML5 canvas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-white p-8">
        <p className="text-red-400 font-semibold mb-2">⚠️ {error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 overflow-hidden">
      {/* Controls Bar */}
      <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between border-b border-gray-700 text-sm flex-wrap gap-2 shadow-inner">
        <div className="flex items-center space-x-2">
          <button
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber(p => Math.max(p - 1, 1))}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-40 font-semibold transition"
          >
            ◀ Prev
          </button>
          <span className="font-medium text-gray-300">
            Page <span className="text-white font-bold">{pageNumber}</span> of <span className="text-white font-bold">{numPages}</span>
          </span>
          <button
            disabled={pageNumber >= numPages}
            onClick={() => setPageNumber(p => Math.min(p + 1, numPages))}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-40 font-semibold transition"
          >
            Next ▶
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setScale(s => Math.max(s - 0.2, 0.6))}
            className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 rounded font-bold"
            title="Zoom Out"
          >
            🔍 -
          </button>
          <span className="text-xs text-gray-300 w-12 text-center font-mono">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale(s => Math.min(s + 0.2, 2.5))}
            className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 rounded font-bold"
            title="Zoom In"
          >
            🔍 +
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="flex-1 overflow-auto p-4 flex justify-center items-start bg-gray-950">
        <canvas ref={canvasRef} className="shadow-2xl rounded bg-white max-w-full h-auto my-auto" />
      </div>
    </div>
  )
}

const DocumentList = ({ userRole, category = 'Study Material' }) => {
  const { user } = useAuth()
  const [documents, setDocuments] = useState([])
  const [filteredDocuments, setFilteredDocuments] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    classId: '',
    topic: '',
    sortBy: 'latest'
  })
  const [extraCourses, setExtraCourses] = useState([])
  const [previewDoc, setPreviewDoc] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    fetchData()
  }, [category])

  const fetchCourses = async () => {
    try {
      const response = await courseAPI.getAllCourses()
      if (response.data && response.data.success) {
        const activeCourses = response.data.courses
          .filter(course => course.classType === 'course' && course.status === 'active')
        setExtraCourses(activeCourses)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  useEffect(() => {
    applyFilters()
  }, [documents, filters])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      const docsResponse = await documentAPI.getAllDocuments({ category })
      
      // Handle documents response
      const docsData = docsResponse.data.data || docsResponse.data || []
      const docsArray = Array.isArray(docsData) ? docsData : []
      setDocuments(docsArray)
      
      // Extract unique classes from documents themselves
      const uniqueClasses = []
      const classMap = new Map()
      
      docsArray.forEach(doc => {
        const docClassId = (doc.classId && typeof doc.classId === 'object') ? doc.classId._id : doc.classId;
        if (docClassId && !classMap.has(docClassId)) {
          classMap.set(docClassId, {
            _id: docClassId,
            title: doc.className || docClassId
          })
          uniqueClasses.push({
            _id: docClassId,
            title: doc.className || docClassId
          })
        }
      })
      
      setClasses(uniqueClasses)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(`Failed to load documents: ${err.response?.data?.message || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = documents

    // Filter by class
    if (filters.classId) {
      filtered = filtered.filter(doc => {
        const docClassId = (doc.classId && typeof doc.classId === 'object') ? doc.classId._id : doc.classId;
        const docClassName = doc.className;
        return docClassId === filters.classId || docClassName === filters.classId;
      })
    }

    // Filter by topic
    if (filters.topic) {
      filtered = filtered.filter(doc =>
        doc.topic.toLowerCase().includes(filters.topic.toLowerCase())
      )
    }

    // Sort
    if (filters.sortBy === 'latest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } else if (filters.sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    } else if (filters.sortBy === 'popular') {
      filtered.sort((a, b) => b.downloads - a.downloads)
    }

    setFilteredDocuments(filtered)
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleResetFilters = () => {
    setFilters({
      classId: '',
      topic: '',
      sortBy: 'latest'
    })
  }

  const handleView = async (doc) => {
    setPreviewLoading(true)
    setPreviewError('')
    setPreviewDoc({
      title: doc.title || 'Document Preview',
      topic: doc.topic || '',
      className: doc.className || '',
      docId: doc._id,
      arrayBuffer: null,
      blobUrl: null,
      fileType: 'loading'
    })

    try {
      let response;
      if (doc._id) {
        response = await documentAPI.viewDocument(doc._id);
      } else {
        response = await documentAPI.downloadDocument(doc._id);
      }

      const rawBuffer = response.data;
      const contentType = (response.headers['content-type'] || '').toLowerCase();

      if (contentType.includes('image')) {
        const blob = new Blob([rawBuffer], { type: contentType });
        const blobUrl = window.URL.createObjectURL(blob);
        setPreviewDoc(prev => ({
          ...prev,
          blobUrl,
          fileType: 'image'
        }));
      } else if (contentType.includes('text') || contentType.includes('json')) {
        const textContent = new TextDecoder().decode(rawBuffer);
        setPreviewDoc(prev => ({
          ...prev,
          textContent,
          fileType: 'text'
        }));
      } else {
        // PDF or default document -> Render with HTML5 Canvas Viewer!
        setPreviewDoc(prev => ({
          ...prev,
          arrayBuffer: rawBuffer,
          fileType: 'pdf'
        }));
      }
    } catch (err) {
      console.error('Error loading preview:', err);
      setPreviewError('Unable to fetch file for preview. Please click Download File below.');
    } finally {
      setPreviewLoading(false);
    }
  }

  const handleClosePreview = () => {
    if (previewDoc && previewDoc.blobUrl) {
      window.URL.revokeObjectURL(previewDoc.blobUrl);
    }
    setPreviewDoc(null);
    setPreviewError('');
    setPreviewLoading(false);
  }

  const handleDownload = async (documentId, fileName, fileUrl) => {
    try {
      const response = await documentAPI.downloadDocument(documentId)
      
      // Check if response is actually a JSON error message returned as a Blob
      if (response.data && response.data.type === 'application/json') {
        const text = await response.data.text()
        try {
          const json = JSON.parse(text)
          alert(`⚠️ ${json.message || 'Failed to download document'}`)
          return
        } catch (e) {
          // not json, proceed
        }
      }

      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const downloadName = fileName || 'document';
      link.setAttribute('download', downloadName)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error downloading document:', err)
      if (fileUrl) {
        const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const baseUrl = apiURL.replace(/\/api\/?$/, '');
        const cleanPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
        const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${baseUrl}${cleanPath}`;
        window.open(fullUrl, '_blank');
      } else {
        alert('Failed to download document. Please try again.')
      }
    }
  }

  const handleDelete = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        const response = await documentAPI.deleteDocument(documentId)
        if (response.data.success) {
          setDocuments(documents.filter(doc => doc._id !== documentId))
          alert('Document deleted successfully')
        }
      } catch (err) {
        console.error('Error deleting document:', err)
        alert('Failed to delete document')
      }
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Student Specific Notice Banner */}
      {userRole === 'student' && (
        <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg shadow-sm">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🎓</span>
            <div>
              <h4 className="font-bold text-blue-900 text-base">Your Enrolled Class Documents</h4>
              <p className="text-sm text-blue-700">
                Showing study materials specifically uploaded for your class: <span className="font-semibold text-blue-900">{user?.course || user?.class || 'Your Class'}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="text-2xl mr-2">🔍</span>
          Filter Documents
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Class Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
            <select
              name="classId"
              value={filters.classId}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-medium"
            >
              <option value="">All Classes</option>
              {renderGroupedClassOptions(extraCourses)}
            </select>
          </div>

          {/* Topic Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Topic</label>
            <input
              type="text"
              name="topic"
              value={filters.topic}
              onChange={handleFilterChange}
              placeholder="Search by topic..."
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
            />
          </div>

          {/* Sort Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-medium"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="popular">Most Downloaded</option>
            </select>
          </div>
        </div>

        {/* Reset Button */}
        {(filters.classId || filters.topic || filters.sortBy !== 'latest') && (
          <div className="flex justify-end">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium transition-all duration-200"
            >
              🔄 Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Document Count */}
      <div className="text-sm text-gray-600">
        Found <span className="font-bold text-red-600">{filteredDocuments.length}</span> document(s)
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-600 text-lg">No documents found</p>
          <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or check back later</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map(doc => (
            <div
              key={doc._id}
              className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6 border-l-4 border-red-500"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">📄</span>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{doc.title}</h3>
                      <p className="text-sm text-gray-500">
                        📚 Class: <span className="font-semibold text-gray-700">{doc.className}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* View/Download/Delete Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleView(doc)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition cursor-pointer shadow-sm"
                    title="View file on screen without downloading"
                  >
                    <span>👁️</span>
                    View
                  </button>

                  <button
                    onClick={() => handleDownload(doc._id, doc.fileName || doc.title, doc.fileUrl)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition cursor-pointer shadow-sm"
                  >
                    <span>⬇️</span>
                    Download
                  </button>

                  {/* Delete button only for admin or document author */}
                  {(userRole === 'admin' || user?._id === doc.uploadedBy._id) && (
                    <button
                      onClick={() => handleDelete(doc._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition shadow-sm"
                    >
                      <span>🗑️</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Topic and Details */}
              <div className="mb-4 space-y-2">
                <p className="text-gray-700">
                  <span className="font-semibold">📌 Topic:</span> {doc.topic}
                </p>
                {doc.description && (
                  <p className="text-gray-600">
                    <span className="font-semibold">📝 Description:</span> {doc.description}
                  </p>
                )}
              </div>

              {/* Meta Information */}
              <div className="flex gap-4 text-sm text-gray-500 border-t pt-4 flex-wrap">
                <span className="flex items-center gap-1">
                  <span>👨‍🏫</span>
                  {doc.uploadedByName}
                </span>
                <span className="flex items-center gap-1">
                  <span>📅</span>
                  {formatDate(doc.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <span>💾</span>
                  {formatFileSize(doc.fileSize)}
                </span>
                <span className="flex items-center gap-1">
                  <span>⬇️</span>
                  {doc.downloads} download{doc.downloads !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Inline Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 p-4 text-white flex justify-between items-center shadow-md">
              <div className="flex items-center space-x-3 overflow-hidden pr-4">
                <span className="text-2xl flex-shrink-0">📄</span>
                <div className="truncate">
                  <h3 className="text-lg font-bold text-white truncate">{previewDoc.title}</h3>
                  <p className="text-xs text-blue-100 truncate">
                    Topic: <span className="font-semibold text-white">{previewDoc.topic}</span> {previewDoc.className && `| Class: ${previewDoc.className}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={() => handleDownload(previewDoc.docId, previewDoc.title, null)}
                  className="px-3.5 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span>⬇️</span> Download File
                </button>
                <button
                  onClick={handleClosePreview}
                  className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors ml-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body: Custom Renderers */}
            <div className="flex-1 bg-gray-900 relative overflow-hidden flex items-center justify-center">
              {previewLoading ? (
                <div className="text-center text-white p-8">
                  <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-blue-400 mx-auto mb-4"></div>
                  <p className="text-gray-300 font-medium">Fetching document content...</p>
                </div>
              ) : previewError ? (
                <div className="text-center bg-white/10 p-8 rounded-xl max-w-md text-white border border-white/20">
                  <span className="text-4xl mb-3 block">⚠️</span>
                  <p className="font-semibold text-lg mb-2">Preview Error</p>
                  <p className="text-sm text-gray-300 mb-6">{previewError}</p>
                  <button
                    onClick={() => handleDownload(previewDoc.docId, previewDoc.title, null)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-sm transition shadow-lg"
                  >
                    ⬇️ Download File
                  </button>
                </div>
              ) : previewDoc.fileType === 'image' ? (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img
                    src={previewDoc.blobUrl}
                    alt={previewDoc.title}
                    className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
                  />
                </div>
              ) : previewDoc.fileType === 'text' ? (
                <div className="w-full h-full p-4 overflow-auto bg-gray-950 text-green-400 font-mono text-sm">
                  <pre className="whitespace-pre-wrap">{previewDoc.textContent}</pre>
                </div>
              ) : (
                <PdfCanvasViewer arrayBuffer={previewDoc.arrayBuffer} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentList