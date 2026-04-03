// backend/config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // disable automatic index creation by Mongoose to avoid name conflicts
      autoIndex: false,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📁 Database: ${conn.connection.name}`);
    
    // Create indexes
    await createIndexes();
    
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    
    // Create indexes safely (ignore existing-name conflicts and continue)
    const createIndexSafe = async (collectionName, spec, options) => {
      try {
        await db.collection(collectionName).createIndex(spec, options);
      } catch (err) {
        const msg = (err && err.message) ? err.message : String(err);
        // ignore conflicts caused by an existing index with the same name
        if (msg.includes('same name') || msg.includes('already exists') || msg.includes('IndexOptionsConflict')) {
          console.warn(`⚠️ Index conflict for ${collectionName} ${JSON.stringify(spec)} - skipping: ${msg}`);
        } else {
          // rethrow unexpected errors to surface them
          throw err;
        }
      }
    };

    // User indexes
    await createIndexSafe('users', { email: 1 }, { unique: true });
    await createIndexSafe('users', { enrollmentId: 1 }, { unique: true });
    await createIndexSafe('users', { role: 1 });
    await createIndexSafe('users', { status: 1 });
    await createIndexSafe('users', { course: 1 });

    // Course indexes
    await createIndexSafe('courses', { name: 1 });
    await createIndexSafe('courses', { category: 1, status: 1 });
    await createIndexSafe('courses', { status: 1 });
    await createIndexSafe('courses', { instructorId: 1 });

    // Payment indexes
    await createIndexSafe('payments', { paymentId: 1 }, { unique: true });
    await createIndexSafe('payments', { studentId: 1, status: 1 });
    await createIndexSafe('payments', { orderId: 1 });
    await createIndexSafe('payments', { createdAt: -1 });
    await createIndexSafe('payments', { month: 1 });

    // Class indexes
    await createIndexSafe('classes', { startTime: 1, status: 1 });
    await createIndexSafe('classes', { courseId: 1, startTime: 1 });
    await createIndexSafe('classes', { instructorId: 1 });
    await createIndexSafe('classes', { status: 1 });

    // Notice indexes
    await createIndexSafe('notices', { status: 1, publishDate: -1 });
    await createIndexSafe('notices', { category: 1, priority: 1 });
    await createIndexSafe('notices', { target: 1 });
    await createIndexSafe('notices', { publishedBy: 1 });
    
    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error.message);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('🔗 MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB connection disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔌 MongoDB connection closed through app termination');
  process.exit(0);
});

module.exports = connectDB;