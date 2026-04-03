const Class = require('../models/Class');

// Helper functions
const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// @desc    Create new class
// @route   POST /api/classes
// @access  Private/Admin
const createClass = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subject,
      topic,
      startTime,
      duration,
      meetingLink,
      meetingPlatform = 'google_meet',
      instructorName,
      targetAudience = ['all'],
      visibility = 'all_students'
    } = req.body;

    // Validate required fields
    if (!title || !subject || !startTime || !duration || !meetingLink || !instructorName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Calculate end time for validation
    const startDateTime = new Date(startTime);
    const endDateTime = new Date(startDateTime.getTime() + parseInt(duration) * 60000);

    if (endDateTime < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot schedule class in the past'
      });
    }
const now = new Date();
let classStatus = 'upcoming';

if (startDateTime <= now && endDateTime > now) {
  classStatus = 'live';
} else if (endDateTime <= now) {
  classStatus = 'completed';
}
    const newClass = await Class.create({
      title,
      description,
      category,
      subject,
      topic,
      startTime: startDateTime,
      duration: parseInt(duration),
      meetingLink,
      meetingPlatform,
      instructorName,
      instructorId: req.user.id,
      createdBy: req.user.id,
      targetAudience,
      visibility,
      status: classStatus
    });

    res.status(201).json({
      success: true,
      message: 'Class scheduled successfully',
      class: newClass
    });

  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all classes with auto status update
// @route   GET /api/classes
// @access  Private
const getAllClasses = async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    
    // First, update statuses of all classes based on current time
    await updateClassStatuses();

    let query = {};
    
    // Filter by status if provided
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // For students, filter by visibility and target audience
    if (req.user.role === 'student') {
      query.$or = [
        { visibility: 'all_students' },
        { targetAudience: 'all' }
      ];
      
      // If student has a class, also show classes for their class
      if (req.user.class) {
        query.$or.push({ targetAudience: req.user.class });
      }
    }
    
    const classes = await Class.find(query)
      .sort({ startTime: 1 })
      .limit(parseInt(limit))
      .select('-attendees -__v')
      .lean();

    // Add formatted fields for frontend
  const formattedClasses = classes.map(cls => ({
  _id: cls._id,
  name: cls.title, // frontend me name use ho raha hai
  category: cls.category || 'General',
  instructor: cls.instructorName || 'Not assigned',
  totalStudents: cls.attendees?.length || 0,
  classType: 'class',
  status: cls.status || 'upcoming',
  startTime: cls.startTime,
  formattedTime: formatTime(cls.startTime),
  formattedDate: formatDate(cls.startTime)
}));
    
    res.status(200).json({
      success: true,
      count: formattedClasses.length,
      classes: formattedClasses
    });

  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get upcoming classes (for public view)
// @route   GET /api/classes/upcoming
// @access  Public
const getUpcomingClasses = async (req, res) => {
  try {
    // Update statuses first
    await updateClassStatuses();
    
    const now = new Date();
    
    const upcomingClasses = await Class.find({
  status: { $in: ['upcoming', 'live'] }
})
.sort({ startTime: 1 })
.limit(10)
.select('title subject topic startTime duration instructorName meetingLink status category attendees')
.lean();
    
    // Format the response
    const formattedClasses = upcomingClasses.map(cls => ({
      _id: cls._id,
      title: cls.title,
      subject: cls.subject,
      topic: cls.topic,
      startTime: cls.startTime,
      duration: cls.duration,
      instructorName: cls.instructorName,
      meetingLink: cls.meetingLink,
      status: cls.status,
      category: cls.category,
      formattedTime: formatTime(cls.startTime),
      formattedDate: formatDate(cls.startTime),
      endTime: new Date(cls.startTime.getTime() + cls.duration * 60000)
    }));
    
 res.status(200).json({
  success: true,
  count: formattedClasses.length,
  classes: formattedClasses   // 👈 important (frontend filteredCourses use karta hai)
});

  } catch (error) {
    console.error('Error fetching upcoming classes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get live classes (currently happening)
// @route   GET /api/classes/live
// @access  Public
const getLiveClasses = async (req, res) => {
  try {
    // Update statuses first
    await updateClassStatuses();
    
    const now = new Date();
    
    const liveClasses = await Class.find({
      status: 'live'
    })
    .sort({ startTime: 1 })
    .select('title subject topic startTime duration instructorName meetingLink attendees')
    .lean();
    
    // Filter to only classes that are actually happening right now
    const currentlyLiveClasses = liveClasses.filter(cls => {
      const startTime = new Date(cls.startTime);
      const endTime = new Date(startTime.getTime() + cls.duration * 60000);
      return startTime <= now && endTime > now;
    });
    
    const formattedClasses = currentlyLiveClasses.map(cls => {
      const endTime = new Date(cls.startTime.getTime() + cls.duration * 60000);
      return {
        _id: cls._id,
        title: cls.title,
        subject: cls.subject,
        topic: cls.topic,
        startTime: cls.startTime,
        duration: cls.duration,
        instructorName: cls.instructorName,
        meetingLink: cls.meetingLink,
        studentCount: cls.attendees?.length || 0,
        elapsedTime: Math.floor((now - cls.startTime) / 60000), // minutes
        remainingTime: Math.max(0, Math.floor((endTime - now) / 60000)),
        endTime: endTime
      };
    });
    
    res.status(200).json({
      success: true,
      count: formattedClasses.length,
      classes: formattedClasses
    });

  } catch (error) {
    console.error('Error fetching live classes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Join a class
// @route   POST /api/classes/:id/join
// @access  Private/Student
const joinClass = async (req, res) => {
  try {
    const classId = req.params.id;
    
    const classItem = await Class.findById(classId);
    
    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    const now = new Date();
    const endTime = new Date(classItem.startTime.getTime() + classItem.duration * 60000);
    
    // Check if class is accessible
    if (now > endTime) {
      return res.status(400).json({
        success: false,
        message: 'Class has ended'
      });
    }
    
    // Check if already joined
    const alreadyJoined = classItem.attendees?.some(
      attendee => attendee.studentId.toString() === req.user.id
    );
    
    if (!alreadyJoined) {
      classItem.attendees = classItem.attendees || [];
      classItem.attendees.push({
        studentId: req.user.id,
        joinedAt: now
      });
      
      await classItem.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Joined class successfully',
      meetingLink: classItem.meetingLink,
      classDetails: {
        title: classItem.title,
        subject: classItem.subject,
        topic: classItem.topic,
        instructorName: classItem.instructorName
      }
    });

  } catch (error) {
    console.error('Error joining class:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete a class
// @route   DELETE /api/classes/:id
// @access  Private/Admin
const deleteClass = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);
    
    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    // Check if user is admin or created this class
    if (req.user.role !== 'admin' && classItem.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this class'
      });
    }
    
    await classItem.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Class deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update class statuses based on current time
// @route   POST /api/classes/update-statuses
// @access  Private/Admin
const updateClassStatuses = async (req, res) => {
  try {
    const now = new Date();
    
    // Update upcoming to live (class has started but not ended)
    await Class.updateMany(
      {
        startTime: { $lte: now },
        status: 'upcoming',
        $expr: {
          $gt: [
            { $add: ['$startTime', { $multiply: ['$duration', 60000] }] },
            now
          ]
        }
      },
      { status: 'live' }
    );

    // Update live to completed (class has ended)
    await Class.updateMany(
      {
        status: 'live',
        $expr: {
          $lte: [
            { $add: ['$startTime', { $multiply: ['$duration', 60000] }] },
            now
          ]
        }
      },
      { status: 'completed' }
    );

    // Also update any upcoming classes that should have been live
    await Class.updateMany(
      {
        startTime: { $lte: now },
        status: 'upcoming'
      },
      { status: 'live' }
    );

    const result = {
      updated: 'Statuses updated successfully'
    };

    if (res) {
      res.status(200).json({
        success: true,
        message: 'Class statuses updated successfully'
      });
    }
    
    return result;

  } catch (error) {
    console.error('Error updating class statuses:', error);
    if (res) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
    throw error;
  }
};

// @desc    Clean up old completed classes (older than 7 days)
// @route   DELETE /api/classes/cleanup
// @access  Private/Admin
const cleanupOldClasses = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    
    // First mark classes older than 7 days as 'archived' or delete them
    const result = await Class.deleteMany({
      status: 'completed',
      $expr: {
        $lte: [
          { $add: ['$startTime', { $multiply: ['$duration', 60000] }] },
          sevenDaysAgo
        ]
      }
    });

    res.status(200).json({
      success: true,
      message: `Cleaned up ${result.deletedCount} old classes`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error cleaning up old classes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all classes for admin (including completed)
// @route   GET /api/classes/admin/all
// @access  Private/Admin
const getAllClassesForAdmin = async (req, res) => {
  try {
    // Update statuses first
    await updateClassStatuses();

    const { status, limit = 100 } = req.query;

    let query = {};

    // Filter by status if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    const classes = await Class.find(query)
      .sort({ startTime: -1 }) // Most recent first
      .limit(parseInt(limit))
      .select('-attendees -__v')
      .lean();

    // Add formatted fields for admin dashboard
    const formattedClasses = classes.map(cls => ({
      _id: cls._id,
      title: cls.title,
      subject: cls.subject,
      topic: cls.topic,
      category: cls.category || 'General',
      instructorName: cls.instructorName,
      startTime: cls.startTime,
      duration: cls.duration,
      status: cls.status === 'completed' ? 'inactive' : cls.status,
      meetingLink: cls.meetingLink,
      totalStudents: cls.attendees?.length || 0,
      formattedTime: formatTime(cls.startTime),
      formattedDate: formatDate(cls.startTime)
    }));

    res.status(200).json({
      success: true,
      count: formattedClasses.length,
      classes: formattedClasses
    });

  } catch (error) {
    console.error('Error fetching all classes for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get class statistics
// @route   GET /api/classes/stats
// @access  Private/Admin
const getClassStats = async (req, res) => {
  try {
    // Update statuses first
    await updateClassStatuses();

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalClasses,
      upcomingCount,
      liveCount,
      completedCount,
      cancelledCount,
      weeklyClasses
    ] = await Promise.all([
      Class.countDocuments(),
      Class.countDocuments({ status: 'upcoming' }),
      Class.countDocuments({ status: 'live' }),
      Class.countDocuments({ status: 'completed' }),
      Class.countDocuments({ status: 'cancelled' }),
      Class.countDocuments({
        startTime: { $gte: now, $lte: sevenDaysFromNow }
      })
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total: totalClasses,
        upcoming: upcomingCount,
        live: liveCount,
        completed: completedCount,
        cancelled: cancelledCount,
        weekly: weeklyClasses
      }
    });

  } catch (error) {
    console.error('Error getting class stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  createClass,
  getAllClasses,
  getUpcomingClasses,
  getLiveClasses,
  getAllClassesForAdmin,
  joinClass,
  deleteClass,
  updateClassStatuses,
  cleanupOldClasses,
  getClassStats
};