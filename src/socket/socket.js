import { Server } from 'socket.io';

export const setupWebSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Track document connections
  const documentSessions = new Map();

  io.on('connection', (socket) => {
    let currentDocument = null;

    socket.on('join-document', ({ documentId, user }) => {
      // Leave previous document if any
      if (currentDocument) {
        socket.leave(currentDocument);
        
        const sessions = documentSessions.get(currentDocument);
        if (sessions) {
          sessions.delete(socket.id);
          if (sessions.size === 0) {
            documentSessions.delete(currentDocument);
          }
        }
      }

      // Join new document
      socket.join(documentId);
      currentDocument = documentId;

      if (!documentSessions.has(documentId)) {
        documentSessions.set(documentId, new Map());
      }
      documentSessions.get(documentId).set(socket.id, user);
    });

    socket.on('send-changes', ({ delta, documentId }) => {
      if (currentDocument === documentId) {
        socket.to(documentId).emit('receive-changes', delta);
      }
    });

    socket.on('disconnect', () => {
      if (currentDocument) {
        const sessions = documentSessions.get(currentDocument);
        if (sessions) {
          sessions.delete(socket.id);
          if (sessions.size === 0) {
            documentSessions.delete(currentDocument);
          }
        }
        socket.leave(currentDocument);
      }
    });
  });

  return io;
};