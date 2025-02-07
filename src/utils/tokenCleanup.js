import TokenBlacklist from '../models/token.model.js';

export const cleanupExpiredTokens = async () => {
  try {
    const result = await TokenBlacklist.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    console.log(`Cleaned up ${result.deletedCount} expired tokens`);
  } catch (error) {
    console.error('Token cleanup failed:', error);
  }
};