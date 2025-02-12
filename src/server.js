import { createServer } from 'http';
import app from './app.js';
import { setupWebSocket } from './socket/socket.js';
import { cleanupExpiredTokens } from './utils/tokenCleanup.js';

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);
setupWebSocket(httpServer);

// Run token cleanup every 24 hours (silently)
setInterval(cleanupExpiredTokens, 24 * 60 * 60 * 1000);

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
