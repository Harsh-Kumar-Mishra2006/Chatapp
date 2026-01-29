const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

// Import database connection
const connectDB = require('./config/db');

// Import routes and socket handler
const apiRoutes = require('./routes/api');
const socketHandler = require('./socket/socketHandler');

dotenv.config();

const app = express();
const server = http.createServer(app);

// In your backend index.js
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowEIO3: true, // Add this for compatibility
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  }
});

// Update CORS middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', apiRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Chat API Server is running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      users: {
        register: 'POST /api/users/register',
        getAll: 'GET /api/users',
        getOne: 'GET /api/users/:userId',
        updateStatus: 'PUT /api/users/:userId/status'
      },
      messages: {
        getByRoom: 'GET /api/messages/:roomId',
        unreadCount: 'GET /api/messages/unread/:userId',
        markRead: 'POST /api/messages/mark-read',
        delete: 'DELETE /api/messages/:messageId',
        search: 'GET /api/messages/search/:roomId'
      }
    }
  });
});

// Connect to MongoDB
connectDB();

// Socket.io handler
socketHandler(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || "http://localhost:3000"}`);
  console.log(`📊 MongoDB connected`);
  console.log(`🔌 Socket.IO ready for connections`);
});