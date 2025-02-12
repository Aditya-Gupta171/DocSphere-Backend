import crypto from 'crypto';
import Document from '../models/document.model.js';
import { sendInviteEmail } from '../utils/emailService.js';

export const inviteCollaborator = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { email, accessLevel } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const doc = await Document.findById(documentId);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if already a collaborator
    const existingCollaborator = doc.collaborators.find(
      c => c.user.email === email
    );

    if (existingCollaborator) {
      return res.status(400).json({ message: 'User is already a collaborator' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const inviteLink = `${process.env.FRONTEND_URL}/join/${documentId}/${token}`;

    // Store invitation with access level
    doc.inviteLinks = [...(doc.inviteLinks || []), {
      email,
      token,
      expiresAt,
      accessLevel: accessLevel || 'write'
    }];

    await doc.save();
    await sendInviteEmail(email, inviteLink, req.user.name);

    res.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('Invitation error:', error);
    res.status(500).json({ message: 'Failed to process invitation' });
  }
};

export const acceptInvitation = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { token } = req.body;
    const userEmail = req.user.email;

    console.log('Accepting invitation:', { documentId, token, userEmail });

    const doc = await Document.findById(documentId);
    
    if (!doc) {
      return res.status(404).json({ 
        message: 'Document not found' 
      });
    }

    // Validate invitation
    const invite = doc.validateInvite(token, userEmail);
    
    if (!invite) {
      return res.status(404).json({ 
        message: 'Invalid or expired invitation' 
      });
    }

    // Check if already a collaborator
    const isExistingCollaborator = doc.collaborators.some(
      c => c.user.toString() === req.user._id.toString()
    );

    if (isExistingCollaborator) {
      return res.status(400).json({ 
        message: 'Already a collaborator' 
      });
    }

    // Add as collaborator with correct access level
    doc.collaborators.push({
      user: req.user._id,
      accessLevel: invite.accessLevel
    });

    // Remove used invitation
    doc.inviteLinks = doc.inviteLinks.filter(i => i.token !== token);

    await doc.save();

    res.json({ 
      message: 'Successfully joined document',
      document: doc
    });

  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ 
      message: 'Failed to join document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};