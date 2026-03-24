// import 'dotenv/config'

// import http from 'http';
// import app from './app';

// import { env } from './config/env';
// import { connectDatabase } from './config/database';
// // import { connectRedis } from './config/redis';
// import { initWebSocket } from './services/websocket.service';
// import { logger } from './utils/logger';

// async function bootstrap(): Promise<void> {
//   try {
//     // Connect database
//     await connectDatabase();
//     // await connectRedis();

//     // Create HTTP server
//     const server = http.createServer(app);

//     // Init WebSocket
//     initWebSocket(server);

//     // IMPORTANT → listen on 0.0.0.0 for production servers
//     const PORT = env.PORT || 5001;

//     server.listen(PORT, "0.0.0.0", () => {
//       logger.info(`🚀 TeamTreck API running on port ${PORT} [${env.NODE_ENV}]`);
//       logger.info(`Health: http://0.0.0.0:${PORT}/health`);
//       logger.info(`WebSocket: ws://0.0.0.0:${PORT}/ws`);
//     });

//     // Graceful shutdown
//     const shutdown = (signal: string) => {
//       logger.info(`${signal} received — shutting down gracefully...`);

//       server.close(() => {
//         logger.info('HTTP server closed');
//         process.exit(0);
//       });

//       setTimeout(() => {
//         logger.error('Forced shutdown after timeout');
//         process.exit(1);
//       }, 10000);
//     };

//     process.on('SIGTERM', () => shutdown('SIGTERM'));
//     process.on('SIGINT', () => shutdown('SIGINT'));

//   } catch (err) {
//     logger.error('Bootstrap failed', err);
//     process.exit(1);
//   }
// }

// bootstrap();


import 'dotenv/config'

import http from 'http';
import app from './app';


import { env } from './config/env';
import { connectDatabase } from './config/database';
// import { connectRedis } from './config/redis';
import { initWebSocket } from './services/websocket.service';
import { logger } from './utils/logger';
import { initCleanupService } from './services/cleanup.service';

async function bootstrap(): Promise<void> {
  // Connect infrastructure
  await connectDatabase();
  // await connectRedis();

  // Create HTTP server + attach Socket.IO
  const server = http.createServer(app);
  initWebSocket(server);

  // Initialize background services
  initCleanupService();

  server.listen(env.PORT, () => {
    logger.info(`🚀 TeamTreck API running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`   Health: http://localhost:${env.PORT}/health`);
    logger.info(`   WebSocket: ws://localhost:${env.PORT}/ws`);
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Forced shutdown after 10s timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Bootstrap failed', err);
  process.exit(1);
});