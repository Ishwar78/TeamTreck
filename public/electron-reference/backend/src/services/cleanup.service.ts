import fs from 'fs';
import path from 'path';
import { Screenshot } from '../models/Screenshot';
import { logger } from '../utils/logger';

const uploadDir = path.resolve(process.cwd(), "uploads");

/**
 * Deletes screenshots older than 30 days from database and disk.
 */
export const deleteOldScreenshots = async () => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        logger.info(`🧹 Starting screenshot cleanup (older than ${thirtyDaysAgo.toISOString()})...`);

        // Find screenshots older than 30 days
        const oldScreenshots = await Screenshot.find({
            timestamp: { $lt: thirtyDaysAgo, $ne: null }
        });

        if (oldScreenshots.length === 0) {
            logger.info('✅ No old screenshots found for cleanup.');
            return;
        }

        let deletedCount = 0;
        for (const shot of oldScreenshots) {
            try {
                // 1. Delete physical file
                const filePath = path.join(uploadDir, shot.s3_key);

                if (fs.existsSync(filePath)) {
                    await fs.promises.unlink(filePath);
                } else {
                    logger.warn(`⚠️ File not found: ${filePath}`);
                }

                // 2. Delete database record
                await Screenshot.findByIdAndDelete(shot._id);
                deletedCount++;
            } catch (err) {
                logger.error(`❌ Failed to delete screenshot ${shot._id}:`, err);
            }
        }

        logger.info(`✅ Cleanup complete. Deleted ${deletedCount} screenshots.`);
    } catch (err) {
        logger.error('❌ Error during screenshot cleanup:', err);
    }
};

/**
 * Initializes the cleanup service to run on startup and then every 24 hours.
 */
export const initCleanupService = () => {
    // Run once on startup
    deleteOldScreenshots();

    // Schedule to run every 24 hours (86,400,000 ms)
    setInterval(deleteOldScreenshots, 24 * 60 * 60 * 1000);
    
    logger.info('🚀 Cleanup service initialized (runs every 24 hours)');
};