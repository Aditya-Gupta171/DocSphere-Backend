import { Server } from 'socket.io';

export const setupWebSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  const documentUsers = new Map();

  io.on('connection', (socket) => {
    console.log('Client connected');
    // console.log(socket.id);

    socket.on('join-document', ({ documentId, user }) => {
      socket.join(documentId);
      
      if (!documentUsers.has(documentId)) {
        documentUsers.set(documentId, new Map());
      }
      
      documentUsers.get(documentId).set(socket.id, user);
      
      io.to(documentId).emit('users-changed', 
        Array.from(documentUsers.get(documentId).values())
      );
    });

    socket.on('send-changes', (delta, documentId) => {
      socket.broadcast.to(documentId).emit('receive-changes', delta);
    });

    socket.on('cursor-move', ({ documentId, cursor, userName }) => {
      socket.broadcast.to(documentId).emit('cursor-update', {
        userId: socket.id,
        cursor,
        userName
      });
    });

    socket.on('disconnect', () => {
      for (const [docId, users] of documentUsers) {
        if (users.delete(socket.id)) {
          io.to(docId).emit('users-changed', 
            Array.from(users.values())
          );
        }
      }
      console.log('Client disconnected');
    });
  });

  return io;
};