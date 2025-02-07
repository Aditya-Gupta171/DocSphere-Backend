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
        ...(content && { content }),
        ...(title && { title }),
        lastModified: Date.now()
      },
      { new: true }
    );
    
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update document' });
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

    const doc = await Document.findById(documentId);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user is owner or already a collaborator
    if (doc.owner.equals(req.user.id) || 
        doc.collaborators.some(c => c.user.equals(req.user.id))) {
      return res.json({ message: 'Already has access' });
    }

    // Verify invite token
    const invite = doc.inviteLinks?.find(i => i.token === token);
    if (!invite) {
      return res.status(401).json({ message: 'Invalid invitation' });
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return res.status(401).json({ message: 'Invitation expired' });
    }

    // Add as collaborator
    doc.collaborators.push({
      user: req.user.id,
      accessLevel: 'write'
    });
    await doc.save();

    res.json({ message: 'Joined document successfully' });
  } catch (error) {
    console.error('Join document error:', error);
    res.status(500).json({ message: 'Failed to join document' });
  }
};