import express from 'express';
import { 
  createDocument, 
  getDocument, 
  getAllDocuments, 
  updateDocument, 
  deleteDocument 
} from '../controllers/document.controller.js';
import { inviteCollaborator, acceptInvitation } from '../controllers/invitation.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', createDocument);
router.get('/', getAllDocuments);
router.get('/:id', getDocument);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);
router.post('/:documentId/invite', inviteCollaborator);
router.post('/:documentId/join', acceptInvitation);

export default router;