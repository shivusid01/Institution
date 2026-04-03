const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Class title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['School', 'Science', 'Commerce', 'Competitive Exams', 'General'],
    default: 'General'
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    trim: true
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required'],
    index: true
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Duration is required'],
    min: 15,
    max: 240
  },
  meetingLink: {
    type: String,
    required: [true, 'Meeting link is required']
  },
  meetingPlatform: {
    type: String,
    enum: ['google_meet', 'zoom', 'microsoft_teams'],
    default: 'google_meet'
  },
  instructorName: {
    type: String,
    required: [true, 'Instructor name is required']
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'live', 'completed', 'cancelled'],
    default: 'upcoming',
    index: true
  },
  recording: {
    type: String,
    default: ''
  },
  materials: [{
    title: String,
    fileUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  attendees: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: Date,
    leftAt: Date
  }],
  targetAudience: [{
    type: String,
    enum: ['all', 'class1', 'class2', 'class3', 'class4', 'class5', 'class6', 'class7', 'class8', 'class9', 'class10', 'class11_commerce', 'class12_commerce', 'bcom1', 'bcom2', 'bcom3', 'mcom', 'competition']
  }],
  visibility: {
    type: String,
    enum: ['all_students', 'specific_classes', 'private'],
    default: 'all_students'
  }
}, {
  timestamps: true
});

// Virtual for end time
classSchema.virtual('endTime').get(function() {
  return new Date(this.startTime.getTime() + this.duration * 60000);
});

// Method to check if class is live
classSchema.methods.isLive = function() {
  const now = new Date();
  const endTime = this.endTime;
  return now >= this.startTime && now <= endTime;
};

// Method to check if class is completed
classSchema.methods.isCompleted = function() {
  const now = new Date();
  const endTime = this.endTime;
  return now > endTime;
};

// Pre-save middleware to auto-update status
classSchema.pre('save', function(next) {
  const now = new Date();
  const endTime = this.endTime;
  
  if (now > endTime) {
    this.status = 'completed';
  } else if (now >= this.startTime && now <= endTime) {
    this.status = 'live';
  }
  
  next();
});

// Index for automatic cleanup queries
classSchema.index({ startTime: 1, status: 1 });
classSchema.index({ 'attendees.studentId': 1 });

module.exports = mongoose.model('Class', classSchema);