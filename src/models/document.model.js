import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'Untitled Document'
  },
  content: {
    type: String,
    default: null
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    accessLevel: {
      type: String,
      enum: ['read', 'write'],
      default: 'write'
    }
  }],
  inviteLinks: [{
    email: String,
    token: String,
    accessLevel: {
      type: String,
      enum: ['read', 'write'],
      default: 'write'
    },
    expiresAt: Date
  }]
}, {
  timestamps: true
});

// Add index for faster invitation queries
documentSchema.index({ 
  'inviteLinks.token': 1,
  'inviteLinks.email': 1 
});

// Add method to validate invitation
documentSchema.methods.validateInvite = function(token, email) {
  return this.inviteLinks.find(
    invite => 
      invite.token === token && 
      invite.email.toLowerCase() === email.toLowerCase() &&
      invite.expiresAt > new Date()
  );
};

export default mongoose.model('Document', documentSchema);