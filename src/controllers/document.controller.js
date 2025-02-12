import Document from '../models/document.model.js';

export const createDocument = async (req, res) => {
  try {
    const doc = await Document.create({
      title: req.body.title || 'Untitled Document',
      content: req.body.content || '',
      owner: req.user.id
    });
    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create document' });
  }
};

export const getDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email');
    
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user has access
    const isCollaborator = doc.collaborators.find(
      c => c.user._id.toString() === req.user._id.toString()
    );

    if (!doc.owner.equals(req.user._id) && !isCollaborator) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch document' });
  }
};

export const getAllDocuments = async (req, res) => {
  try {
    const docs = await Document.find({
      $or: [
        { owner: req.user.id },
        { 'collaborators.user': req.user.id }
      ]
    }).sort({ updatedAt: -1 });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
};

export const updateDocument = async (req, res) => {
  try {
    const { content, title } = req.body;
    
    const doc = await Document.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          ...(content && { content }),
          ...(title && { title }),
          lastModified: new Date() 
        }
      },
      { new: true }
    ).populate('collaborators.user', 'name email');

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json({ doc });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save document' });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete document' });
  }
};

// Add to existing exports
export const joinDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { token } = req.body;
    const userEmail = req.user.email;

    const doc = await Document.findById(documentId);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Find invitation for this email
    const invite = doc.inviteLinks.find(i => 
      i.token === token && 
      i.email.toLowerCase() === userEmail.toLowerCase()
    );

    if (!invite) {
      return res.status(403).json({ 
        message: 'Invalid invitation or not authorized to join' 
      });
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return res.status(401).json({ message: 'Invitation has expired' });
    }

    // Check if already a collaborator
    const isExistingCollaborator = doc.collaborators.some(
      c => c.user.toString() === req.user._id.toString()
    );

    if (isExistingCollaborator) {
      return res.status(400).json({ message: 'Already a collaborator' });
    }

    // Add as collaborator with specified access level
    doc.collaborators.push({
      user: req.user._id,
      accessLevel: invite.accessLevel
    });

    // Remove used invitation
    doc.inviteLinks = doc.inviteLinks.filter(i => i.token !== token);
    await doc.save();

    res.json({ message: 'Successfully joined document' });
  } catch (error) {
    console.error('Join document error:', error);
    res.status(500).json({ message: 'Failed to join document' });
  }
};