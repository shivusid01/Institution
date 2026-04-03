const cron = require('node-cron');
const Class = require('../models/Class');

// Run every minute to update class statuses
const setupCronJobs = () => {
  // Update class statuses every minute
  cron.schedule('* * * * *', async () => {
    console.log('🔄 Running cron job: Updating class statuses...');
    const now = new Date();
    
    try {
      // Update upcoming to live
      const liveResult = await Class.updateMany(
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

      // Update live to completed
      const completedResult = await Class.updateMany(
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

      if (liveResult.modifiedCount > 0 || completedResult.modifiedCount > 0) {
        console.log(`✅ Updated: ${liveResult.modifiedCount} to live, ${completedResult.modifiedCount} to completed`);
      }
    } catch (error) {
      console.error('❌ Error in status update cron job:', error);
    }
  });

  // Run every day at midnight to clean up old completed classes (older than 7 days)
  cron.schedule('0 0 * * *', async () => {
    console.log('🧹 Running cron job: Cleaning up old classes...');
    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    
    try {
      // Delete completed classes older than 7 days
      const result = await Class.deleteMany({
        status: 'completed',
        $expr: {
          $lte: [
            { $add: ['$startTime', { $multiply: ['$duration', 60000] }] },
            sevenDaysAgo
          ]
        }
      });

      if (result.deletedCount > 0) {
        console.log(`✅ Deleted ${result.deletedCount} old classes`);
      }
    } catch (error) {
      console.error('❌ Error in cleanup cron job:', error);
    }
  });

  // Run every hour to ensure statuses are correct (backup)
  cron.schedule('0 * * * *', async () => {
    console.log('🔄 Running hourly status verification...');
    try {
      const now = new Date();
      
      // Force update any classes that might have been missed
      await Class.updateMany(
        {
          startTime: { $lte: now },
          status: 'upcoming'
        },
        { status: 'live' }
      );

      await Class.updateMany(
        {
          $expr: {
            $lte: [
              { $add: ['$startTime', { $multiply: ['$duration', 60000] }] },
              now
            ]
          },
          status: 'live'
        },
        { status: 'completed' }
      );
      
      console.log('✅ Hourly status verification complete');
    } catch (error) {
      console.error('❌ Error in hourly verification:', error);
    }
  });

  console.log('⏰ Cron jobs scheduled:');
  console.log('  - Every minute: Update class statuses');
  console.log('  - Every hour: Verify class statuses');
  console.log('  - Every day at midnight: Clean up old classes (7+ days old)');
};

module.exports = setupCronJobs;