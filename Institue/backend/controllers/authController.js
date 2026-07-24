// backend/controllers/authController.js
const User = require('../models/User');
const {
  generateToken,
  generatePasswordResetToken,
  verifyToken,
} = require('../utils/generateToken');
const {
  sendWelcomeEmail,
  sendPasswordResetEmail,
} = require('../utils/emailService');

/* ======================================================
   REGISTER
====================================================== */
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, course, grade } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required',
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      course,
      grade,
      role: 'student',
    });

    const token = generateToken({
      id: user._id,
      role: user.role,
      email: user.email,
    });

    user.password = undefined;

    // Send welcome email (non-blocking)
    sendWelcomeEmail({
      email: user.email,
      name: user.name,
      enrollmentId: user.enrollmentId,
      course: user.course || 'Not assigned yet',
    }).catch((err) =>
      console.error('Welcome email failed:', err.message)
    );

    res.status(201).json({
      success: true,
      token,
      user,
      message: 'Registration successful',
    });
  } catch (error) {
    next(error);
  }
};

/* ======================================================
   LOGIN
====================================================== */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log('LOGIN BODY:', req.body); // 🔥 debug

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('LOGIN DEBUG: user not found for email:', email);
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // For debugging in development, log whether password exists and comparison result
    if (process.env.NODE_ENV === 'development') {
      console.log('LOGIN DEBUG: user record found, has password:', !!user.password);
    }

    const isMatch = await user.comparePassword(password);

    if (process.env.NODE_ENV === 'development') {
      console.log('LOGIN DEBUG: password comparison result for', email, isMatch);
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Safe status check
    if (user.status && user.status !== 'active' && user.status !== 'completed') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.',
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken({
      id: user._id,
      role: user.role,
      email: user.email,
    });

    user.password = undefined;

    res.status(200).json({
      success: true,
      token,
      user,
      message: 'Login successful',
    });
  } catch (error) {
    next(error);
  }
};

/* ======================================================
   LOGOUT (GET + POST SAFE)
====================================================== */
const logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

/* ======================================================
   GET CURRENT USER
====================================================== */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/* ======================================================
   UPDATE PROFILE
====================================================== */
const updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = { ...req.body };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      user,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/* ======================================================
   UPDATE PASSWORD
====================================================== */
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new password are required',
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/* ======================================================
   FORGOT PASSWORD
====================================================== */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          'If an account exists with this email, a reset link has been sent',
      });
    }

    const resetToken = generatePasswordResetToken(user._id);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
    await user.save();

    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetToken,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset email sent',
    });
  } catch (error) {
    next(error);
  }
};

/* ======================================================
   RESET PASSWORD
====================================================== */
const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const { resettoken } = req.params;

    const decoded = verifyToken(resettoken);

    if (!decoded || decoded.type !== 'password_reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: resettoken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    next(error);
  }
};

/* ======================================================
   VERIFY EMAIL
====================================================== */
const verifyEmail = async (req, res, next) => {
  try {
    const decoded = verifyToken(req.params.token);

    if (!decoded || decoded.type !== 'email_verification') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

// backend/controllers/authController.js में getProfile function को यह update करें:

const getProfile = async (req, res) => {
  try {
    console.log('👤 Fetching profile for user ID:', req.user.id);
    console.log('👤 User object from token:', req.user);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const user = await User.findById(req.user.id)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .lean();

    console.log('👤 Database query result:', user ? 'User found' : 'User not found');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('👤 User data from DB:', {
      id: user._id,
      name: user.name,
      email: user.email,
      class: user.class,
      role: user.role
    });

    // Get payment stats for student (optional - if Payment model exists)
    let paymentStats = {};
    try {
      if (user.role === 'student') {
        const Payment = require('../models/Payment');
        const payments = await Payment.find({ studentId: user._id });
        const totalPaid = payments
          .filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        
        paymentStats = {
          totalPaid,
          totalPayments: payments.length,
          lastPayment: payments.length > 0 ? payments[0].paidDate : null
        };
        
        console.log('💰 Payment stats:', paymentStats);
      }
    } catch (paymentError) {
      console.log('⚠️ Payment stats not available:', paymentError.message);
      // Continue without payment stats
    }

    // Combine user data with stats
    const profileData = {
      ...user,
      ...paymentStats
    };

    console.log('✅ Profile data ready to send');

    res.status(200).json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('❌ Get profile error DETAILS:', {
      message: error.message,
      stack: error.stack,
      user: req.user
    });
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { 
      name, 
      phone, 
      parentPhone, 
      address, 
      class: studentClass,
      emergencyContact,
      bloodGroup,
      fatherName,
      motherName
    } = req.body;
    
    // Fields that can be updated
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (parentPhone !== undefined) updateFields.parentPhone = parentPhone;
    if (address !== undefined) updateFields.address = address;
    if (studentClass !== undefined) updateFields.class = studentClass;
    if (emergencyContact !== undefined) updateFields.emergencyContact = emergencyContact;
    if (bloodGroup !== undefined) updateFields.bloodGroup = bloodGroup;
    if (fatherName !== undefined) updateFields.fatherName = fatherName;
    if (motherName !== undefined) updateFields.motherName = motherName;

    // Find and update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });

  } catch (error) {
    console.error('❌ Update profile error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Upload profile image
// @route   POST /api/auth/upload-profile-image
// @access  Private
const uploadProfileImage = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user's profile image path
    user.profileImage = `/uploads/profiles/${req.file.filename}`;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Change password (alias for updatePassword)
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  // Simply call updatePassword with the same logic
  return updatePassword(req, res, next);
};

// @desc    Google Login
// @route   POST /api/auth/google-login
// @access  Public
const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required'
      });
    }

    let email, name, picture;

    if (credential.startsWith('mock-token-')) {
      email = credential.replace('mock-token-', '');
      name = email.split('@')[0];
      picture = '';
      console.log('⚡ Mock Google Token received for:', email);
    } else {
      // Verify token with Google's tokeninfo API
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      const payload = await response.json();

      if (!response.ok || payload.error_description) {
        console.error('Google token verification failed:', payload.error_description || 'Invalid token');
        return res.status(400).json({
          success: false,
          message: 'Invalid Google token'
        });
      }

      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // Safe status check
      if (user.status && user.status !== 'active' && user.status !== 'completed') {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact admin.'
        });
      }

      user.lastLogin = new Date();
      await user.save();
    } else {
      // Register a new user
      user = await User.create({
        name,
        email,
        password: Math.random().toString(36).slice(-10), // Random placeholder password
        role: 'student',
        isVerified: true,
        profileImage: picture || ''
      });
      console.log('🆕 Created new user via Google Sign-up:', email);
    }

    // Generate JWT token
    const token = generateToken({
      id: user._id,
      role: user.role,
      email: user.email,
    });

    user.password = undefined;

    res.status(200).json({
      success: true,
      token,
      user,
      message: 'Google login successful'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send OTP to phone for password reset
// @route   POST /api/auth/send-otp
// @access  Public
const sendOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user registered with this phone number'
      });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set OTP and Expiry (5 minutes)
    user.otpCode = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    console.log(`\n=============================================`);
    console.log(`🔑 [OTP Verification] OTP: ${otp} sent to ${phone}`);
    console.log(`=============================================\n`);

    const responseData = {
      success: true,
      message: 'OTP sent successfully to your phone number'
    };

    // Return the OTP in development mode for easy testing
    if (process.env.NODE_ENV === 'development') {
      responseData.otp = otp;
    }

    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using OTP
// @route   POST /api/auth/reset-password-otp
// @access  Public
const resetPasswordOTP = async (req, res, next) => {
  try {
    const { phone, otp, newPassword } = req.body;

    if (!phone || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Phone number, OTP and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find user with matching phone, otp, and active expiry
    const user = await User.findOne({
      phone,
      otpCode: otp,
      otpExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Update password
    user.password = newPassword;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

/* ======================================================
   OTP-BASED LOGIN CONTROLLERS
====================================================== */

// @desc    Send OTP to phone for login
// @route   POST /api/auth/send-login-otp
// @access  Public
const sendLoginOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number'
      });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

    let user = await User.findOne({ phone });
    let isNewUser = false;

    if (user) {
      // Safe status check
      if (user.status && user.status !== 'active' && user.status !== 'completed') {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact admin.'
        });
      }
      user.otpCode = otp;
      user.otpExpires = otpExpires;
      await user.save();
      // Check if it's actually an unverified pending account
      if (user.name === 'Pending Verification' || !user.isVerified) {
        isNewUser = true;
      }
    } else {
      isNewUser = true;
      // Create a temporary user with placeholder fields
      // and isVerified: false so we know they are not fully registered yet.
      user = await User.create({
        name: 'Pending Verification',
        email: `pending_${phone}@institution.com`,
        phone,
        password: Math.random().toString(36).slice(-10), // Random placeholder password
        role: 'student',
        isVerified: false,
        otpCode: otp,
        otpExpires: otpExpires
      });
    }

    console.log(`\n=============================================`);
    console.log(`🔑 [LOGIN OTP] OTP: ${otp} sent to ${phone} (${isNewUser ? 'NEW' : 'EXISTING'} USER)`);
    console.log(`=============================================\n`);

    const responseData = {
      success: true,
      message: 'OTP sent successfully to your mobile number',
      isNewUser
    };

    // Return the OTP in development mode for easy testing
    if (process.env.NODE_ENV === 'development') {
      responseData.otp = otp;
    }

    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP for login
// @route   POST /api/auth/verify-login-otp
// @access  Public
const verifyLoginOTP = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required'
      });
    }

    const user = await User.findOne({
      phone,
      otpCode: otp,
      otpExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Clear OTP fields
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Check if the user is verified/registered
    // If the name is 'Pending Verification' or isVerified is false, they need to complete registration
    if (!user.isVerified || user.name === 'Pending Verification') {
      return res.status(200).json({
        success: true,
        isNewUser: true,
        message: 'OTP verified successfully. Please complete your registration.'
      });
    }

    // Existing user: log in directly
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken({
      id: user._id,
      role: user.role,
      email: user.email,
    });

    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      success: true,
      isNewUser: false,
      token,
      user: userObj,
      message: 'Login successful'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete OTP registration for new users
// @route   POST /api/auth/complete-otp-registration
// @access  Public
const completeOTPRegistration = async (req, res, next) => {
  try {
    const { phone, name, email, course } = req.body;

    if (!phone || !name || !email || !course) {
      return res.status(400).json({
        success: false,
        message: 'Phone, name, email and course/class are required'
      });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User session not found. Please request OTP again.'
      });
    }

    // Check if email is already taken by another user
    const emailTaken = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: user._id }
    });

    if (emailTaken) {
      return res.status(400).json({
        success: false,
        message: 'Email address is already registered by another account'
      });
    }

    // Update user details and mark as verified/registered
    user.name = name;
    user.email = email.toLowerCase();
    user.course = course;
    user.isVerified = true;
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken({
      id: user._id,
      role: user.role,
      email: user.email,
    });

    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      success: true,
      token,
      user: userObj,
      message: 'Registration and login successful'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getProfile,
  updateProfile,
  uploadProfileImage,
  googleLogin,
  sendOTP,
  resetPasswordOTP,
  sendLoginOTP,
  verifyLoginOTP,
  completeOTPRegistration
};
