import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'Untitled Document'
  },
  content: String,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inviteLinks: [{
    email: String,
    token: String,
    expiresAt: Date
  }],
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    accessLevel: {
      type: String,
      enum: ['read', 'write'],
      default: 'write'
    }
  }]
}, { timestamps: true });

export default mongoose.model('Document', documentSchema);