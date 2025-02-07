import crypto from 'crypto';
import Document from '../models/document.model.js';
import { sendInviteEmail } from '../utils/emailService.js';

export const inviteCollaborator = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { email } = req.body;

    // Debug logs
    console.log('Invite Request:', { documentId, email, userId: req.user._id });

    const doc = await Document.findById(documentId);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Ownership check
    if (doc.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only document owner can invite collaborators' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const inviteLink = `${process.env.FRONTEND_URL}/join/${documentId}/${token}`;

    try {
      await sendInviteEmail(email, inviteLink, req.user.name || 'A DocSphere user');

      doc.inviteLinks = [...(doc.inviteLinks || []), { email, token, expiresAt }];
      await doc.save();

      res.json({ message: 'Invitation sent successfully' });
    } catch (emailError) {
      console.error('Email error:', emailError);
      res.status(500).json({ message: 'Failed to send invitation email' });
    }
  } catch (error) {
    console.error('Invitation error:', error);
    res.status(500).json({ message: 'Failed to process invitation' });
  }
};

export const acceptInvitation = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { token } = req.body;

    const doc = await Document.findById(documentId);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const invite = doc.inviteLinks?.find(i => i.token === token);
    if (!invite) {
      return res.status(401).json({ message: 'Invalid invitation' });
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return res.status(401).json({ message: 'Invitation expired' });
    }

    if (!doc.collaborators.some(c => c.user.toString() === req.user._id.toString())) {
      doc.collaborators.push({
        user: req.user._id,
        accessLevel: 'write'
      });
    }

    doc.inviteLinks = doc.inviteLinks.filter(i => i.token !== token);
    await doc.save();

    res.json({ message: 'Successfully joined document' });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ message: 'Failed to accept invitation' });
  }
};