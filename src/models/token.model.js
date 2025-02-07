import mongoose from 'mongoose';

const tokenBlacklistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Automatically delete after 24 hours
  }
});

export default mongoose.model('TokenBlacklist', tokenBlacklistSchema);