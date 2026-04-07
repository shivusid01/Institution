// // src/services/api.js - UPDATED (ONLY ESSENTIAL FUNCTIONS)
// import axios from 'axios';

// const API_URL = 'http://localhost:5000/api';

// // Axios instance
// const api = axios.create({
//   baseURL: 'http://localhost:5000/api',
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Attach token automatically
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // ================= AUTH APIs =================
// export const authAPI = {
//   register: (data) => api.post('/auth/register', data),
//   login: (data) => api.post('/auth/login', data),
//   logout: () => api.get('/auth/logout'),
//   getMe: () => api.get('/auth/me'),
//   updateDetails: (data) => api.put('/auth/updatedetails', data),
//   updatePassword: (data) => api.put('/auth/updatepassword', data),
// };

// // ================= USER APIs =================
// export const userAPI = {
//   getAllStudents: () => api.get('/users/students'),
//   getStudent: (id) => api.get(`/users/students/${id}`),
//   updateStudent: (id, data) => api.put(`/users/students/${id}`, data),
//   deleteStudent: (id) => api.delete(`/users/students/${id}`),
// };

// // ================= COURSE APIs =================
// export const courseAPI = {
//   getAllCourses: () => api.get('/courses'),
//   getCourse: (id) => api.get(`/courses/${id}`),
//   createCourse: (data) => api.post('/courses', data),
//   updateCourse: (id, data) => api.put(`/courses/${id}`, data),
//   deleteCourse: (id) => api.delete(`/courses/${id}`),
//   enrollCourse: (courseId) => api.post(`/courses/${courseId}/enroll`),
// };

// // ================= PAYMENT APIs =================
// export const paymentAPI = {
//   // Create Razorpay order
//   createOrder: async (data) => {
//     try {
//       const response = await api.post('/payments/create-order', data);
//       return response;
//     } catch (error) {
//       console.error('Create order error:', error);
//       throw error;
//     }
//   },
//  getAdminPayments: (params) => {
//     console.log('📡 Fetching admin payments with params:', params);
//     return axios.get('/api/payments/admin/all', { params });
//   },


//   getAdminPayments: (params) => axios.get('/api/payments/admin/all', { params }),
//   initiateRefund: (paymentId, data) => axios.post(`/api/payments/${paymentId}/refund`, data),

//     getAllPayments: (params) => {
//     console.log('📡 [API] Fetching all payments with params:', params);
//     return axios.get('/api/payments', { params })
//       .then(response => {
//         console.log('✅ [API] Payments response:', {
//           success: response.data.success,
//           count: response.data.count,
//           total: response.data.total,
//           paymentsLength: response.data.payments?.length
//         });
//         return response;
//       })
//       .catch(error => {
//         console.error('❌ [API] Payments error:', error.response?.data || error.message);
//         throw error;
//       });
//     },

//   // Verify payment after Razorpay success
//   verifyPayment: async (data) => {
//     try {
//       const response = await api.post('/payments/verify', data);
//       return response;
//     } catch (error) {
//       console.error('Verify payment error:', error);
//       throw error;
//     }
//   },

//   // Get student's payments (current logged in student)
//   getStudentPayments: () => api.get('/payments/student'),
  
//   // Download invoice
//   downloadInvoice: (paymentId) => api.get(`/payments/${paymentId}/invoice`, { 
//     responseType: 'blob' 
//   }),
  
//   // Check payment status
//   checkPaymentStatus: (orderId) => api.get(`/payments/status/${orderId}`),
  
//   // Handle failed payment
//   handleFailedPayment: (data) => api.post('/payments/failed', data),
// };

// // ================= CLASS APIs =================
// export const classAPI = {
//   getClasses: () => api.get('/classes'),
//   getClass: (id) => api.get(`/classes/${id}`),
//   createClass: (data) => api.post('/classes', data),
//   updateClass: (id, data) => api.put(`/classes/${id}`, data),
//   deleteClass: (id) => api.delete(`/classes/${id}`),
//   getUpcomingClasses: () => api.get('/classes/student/upcoming'),
//   getLiveClasses: () => api.get('/classes/student/live'),
//   getClassJoinDetails: (classId) => api.get(`/classes/${classId}/join-details`),
//   joinClass: (classId) => api.post(`/classes/${classId}/join`),
// };

// // ================= NOTICE APIs =================
// export const noticeAPI = {
//   getNotices: () => api.get('/notices'),
//   getNotice: (id) => api.get(`/notices/${id}`),
//   createNotice: (data) => api.post('/notices', data),
//   updateNotice: (id, data) => api.put(`/notices/${id}`, data),
//   deleteNotice: (id) => api.delete(`/notices/${id}`),
//   markAsRead: (noticeId) =>
//     api.post(`/notices/${noticeId}/read`),
//   getUnreadNotices: () => api.get('/notices/unread'),
// };

// export default api;




import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ================= PAYMENT APIs =================
export const paymentAPI = {
  // Create Razorpay order
  createOrder: async (data) => {
    try {
      const response = await api.post('/payments/create-order', data);
      return response;
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  },

  // Verify payment after Razorpay success
  verifyPayment: async (data) => {
    try {
      const response = await api.post('/payments/verify', data);
      return response;
    } catch (error) {
      console.error('Verify payment error:', error);
      throw error;
    }
  },

  // Get all payments for admin
  getAllPayments: (params) => {
    return api.get('/payments', { params })
      .then(response => {
        return response;
      })
      .catch(error => {
        throw error;
      });
  },

  // Get student's payments (current logged in student)
  getStudentPayments: () => api.get('/payments/student'),
  
  // Download invoice
  downloadInvoice: (paymentId) => api.get(`/payments/${paymentId}/invoice`, { 
    responseType: 'blob' 
  }),
  
  // Check payment status
  checkPaymentStatus: (orderId) => api.get(`/payments/status/${orderId}`),
  
  // Handle failed payment
  handleFailedPayment: (data) => api.post('/payments/failed', data),

  // Initiate refund
  initiateRefund: (paymentId, data) => api.post(`/payments/${paymentId}/refund`, data),

  // Get payment stats
  getPaymentStats: () => api.get('/payments/stats/overview'),
};

// Export other APIs as before
// ================= AUTH APIs =================
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.get('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateDetails: (data) => api.put('/auth/updatedetails', data),
  updatePassword: (data) => api.put('/auth/updatepassword', data),

  // NEW PROFILE FUNCTIONS
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  uploadProfileImage: (formData) => api.post('/auth/upload-profile-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// ================= USER APIs =================
export const userAPI = {
  getAllStudents: () => api.get('/users/students'),
  getStudent: (id) => api.get(`/users/students/${id}`),
  updateStudent: (id, data) => api.put(`/users/students/${id}`, data),
  deleteStudent: (id) => api.delete(`/users/students/${id}`),
  
  // ✅ Student Registration by Admin
  registerStudent: (data) => {
    return api.post('/users/register-student', data)
      .then(response => {
        return response
      })
      .catch(error => {
        throw error
      })
  },



  sendCredentials: (studentId) => api.post(`/users/send-credentials/${studentId}`),
  sendMessage: (studentId, message) => api.post(`/users/send-message/${studentId}`, { message }),
  markCourseCompleted: (studentId) => api.put(`/users/mark-completed/${studentId}`),
  getStudentPayments: (studentId) => api.get(`/users/${studentId}/payments`),
  exportStudentsCSV: (params) => api.get('/users/export/students', { 
    params,
    responseType: 'blob' // Important for file download
}),
  
  // Bulk actions
  deactivateStudent: (studentId) => api.put(`/users/students/${studentId}`, { status: 'inactive' }),
  activateStudent: (studentId) => api.put(`/users/students/${studentId}`, { status: 'active' }),
  
  // Search with advanced filters
  searchStudents: (params) => api.get('/users/students/search', { params }),
  
  // Contact admin functionality
  contactAdmin: (contactData) => api.post('/contact/admin', contactData),
};
export const courseAPI = {
  getAllCourses: () => {
    return api.get('/courses')
      .then(response => {
        return response;
      })
      .catch(error => {
        throw error;
      });
  },
  getCourse: (id) => api.get(`/courses/${id}`), // ✅ FIXED: Added getCourse function
   createCourse: (data) => {
    return api.post('/courses', data)
      .then(response => {
        return response;
      })
      .catch(error => {
        throw error;
      });
  },
  updateCourse: (id, data) => api.put(`/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
  enrollCourse: (courseId) => api.post(`/courses/${courseId}/enroll`),
};
// src/services/api.js में
// classAPI object update करें:
export const classAPI = {
  
  createClass: (data) => {
    return api.post('/classes', data);
  },
  
  getClasses: (params) => {
    return api.get('/classes', { params });
  },
  
  getUpcomingClasses: () => {
    return api.get('/classes/upcoming');
  },
  
  getLiveClasses: () => {
    return api.get('/classes/live');
  },
  
  joinClass: (classId) => {
    return api.post(`/classes/${classId}/join`);
  },
  deleteClass: (classId) => api.delete(`/classes/${classId}`),

  getClass: (id) => {
    return api.get(`/classes/${id}`);
  }
  
};
// ================= NOTICE APIs =================
export const noticeAPI = {
  // Admin notices
  createNotice: (data) => api.post('/notices', data),
  getAllNotices: (params) => {
    return api.get('/notices', { params });
  },
  updateNotice: (id, data) => api.put(`/notices/${id}`, data),
  deleteNotice: (id) => api.delete(`/notices/${id}`),
  getNoticeStats: () => api.get('/notices/stats/overview'),
  
  // Student notices
  getStudentNotices: (params) => {
    return api.get('/notices/student', { params });
  },
  markNoticeAsRead: (noticeId) => api.post(`/notices/${noticeId}/read`),
  getUnreadCount: () => api.get('/notices/student/unread-count'),
  
  // Get single notice
  getNoticeById: (id) => api.get(`/notices/${id}`)
};

export default api;




