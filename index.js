// app.js
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

// CORS configuration - Allow both local development and deployed frontend
const allowedOrigins = [
  'https://chatapp-frontend-79jv.onrender.com', // Your deployed frontend
  'http://localhost:3000', // Local development
  process.env.CORS_ORIGIN // From environment variable if set
].filter(Boolean); // Remove any undefined/null values

// Socket.IO configuration with CORS
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  }
});

// Express CORS middleware - simplified version
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// REMOVE THIS LINE - it's causing the error
// app.options('*', cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api', apiRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Chat API Server is running',
    version: '1.0.0',
    frontendUrl: 'https://chatapp-frontend-79jv.onrender.com',
    allowedOrigins: allowedOrigins,
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Connect to MongoDB
connectDB();

// Socket.io handler
socketHandler(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 CORS enabled for: ${allowedOrigins.join(', ')}`);
  console.log(`📊 MongoDB connected`);
  console.log(`🔌 Socket.IO ready for connections`);
});