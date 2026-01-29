const events = require('./events');
const Message = require('../model/Message');
const User = require('../model/User'); // Add User import

// Store active users and their socket connections
const activeUsers = new Map();
const userRooms = new Map();

module.exports = (io) => {
  io.on(events.CONNECTION, async (socket) => {
    console.log(`🔗 User connected: ${socket.id}`);

    // User joins the chat
    socket.on(events.USER_JOIN, async (userData) => {
      try {
        const { userId, username } = userData;
        
        if (!userId || !username) {
          socket.emit(events.ERROR, { message: 'User ID and username are required' });
          return;
        }
        
        // Check if user exists in database
        let user = await User.findById(userId);
        if (!user) {
          // Create user if doesn't exist
          user = new User({
            _id: userId,
            username,
            socketId: socket.id,
            isOnline: true,
            lastSeen: new Date()
          });
          await user.save();
        } else {
          // Update user's online status and socket ID
          user.socketId = socket.id;
          user.isOnline = true;
          user.lastSeen = new Date();
          await user.save();
        }
        
        // Store user connection in memory
        activeUsers.set(userId, {
          socketId: socket.id,
          username: user.username,
          userId: user._id,
          joinedAt: new Date(),
          isOnline: true,
          avatar: user.avatar,
          status: user.status
        });
        
        socket.userId = user._id;
        socket.username = user.username;
        
        console.log(`👤 ${user.username} (${userId}) joined the chat`);
        
        // Get all users from database for online status
        const allUsers = await User.find({}, {
          username: 1,
          avatar: 1,
          isOnline: 1,
          status: 1,
          lastSeen: 1
        }).lean();
        
        // Broadcast updated users list
        io.emit(events.GET_ONLINE_USERS, allUsers);
        
      } catch (error) {
        console.error('Error in USER_JOIN:', error);
        socket.emit(events.ERROR, { message: 'Failed to join chat' });
      }
    });

    // Join a room (for private or group chats)
    socket.on(events.JOIN_ROOM, async (roomData) => {
      try {
        const { roomId, userId } = roomData;
        
        if (!roomId || !userId) {
          socket.emit(events.ERROR, { message: 'Room ID and User ID are required' });
          return;
        }
        
        socket.join(roomId);
        
        // Track user rooms in memory
        if (!userRooms.has(userId)) {
          userRooms.set(userId, new Set());
        }
        userRooms.get(userId).add(roomId);
        
        console.log(`🚪 User ${userId} joined room: ${roomId}`);
        
        // Load previous messages for the room
        const messages = await Message.find({ room: roomId })
          .sort({ timestamp: 1 })
          .limit(50)
          .populate('sender', 'username avatar')
          .lean();
        
        socket.emit('load_messages', messages);
        
      } catch (error) {
        console.error('Error in JOIN_ROOM:', error);
        socket.emit(events.ERROR, { message: 'Failed to join room' });
      }
    });

    // Send message
    // In socket/socketHandler.js - Update the SEND_MESSAGE handler

// Send message
socket.on(events.SEND_MESSAGE, async (messageData) => {
  try {
    const { senderId, receiverId, message, roomId, senderName, messageType = 'text', attachment } = messageData;
    
    // Validate required fields
    if (!senderId || !receiverId || !message || !roomId || !senderName) {
      socket.emit(events.ERROR, { message: 'Missing required message fields' });
      return;
    }
    
    if (message.trim().length === 0 && messageType === 'text') {
      socket.emit(events.ERROR, { message: 'Message cannot be empty' });
      return;
    }
    
    // Get sender info from database
    const sender = await User.findById(senderId);
    if (!sender) {
      socket.emit(events.ERROR, { message: 'Sender not found' });
      return;
    }
    
    // Save message to database
    const newMessage = new Message({
      sender: senderId,
      senderName: sender.username,
      receiver: receiverId,
      message: message.trim(),
      room: roomId,
      messageType,
      attachment,
      timestamp: new Date()
    });
    
    await newMessage.save();
    
    // Populate sender info
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'username avatar')
      .lean();
    
    // FIX: Emit with proper event name and structure
    const messageToSend = {
      ...populatedMessage,
      id: populatedMessage._id,
      roomId,
      timeFormatted: new Date(populatedMessage.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    
    console.log(`📤 Emitting message to room ${roomId}:`, messageToSend);
    
    // Emit to ALL clients in the room (including sender)
    io.to(roomId).emit(events.RECEIVE_MESSAGE, messageToSend);
    
    // Also emit to sender specifically for delivery confirmation
    socket.emit(events.MESSAGE_DELIVERED, {
      messageId: newMessage._id,
      roomId,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
    socket.emit(events.ERROR, {
      message: 'Failed to send message',
      error: error.message
    });
  }
});

    // User is typing
    socket.on(events.USER_TYPING, (data) => {
      const { roomId, userId, username } = data;
      socket.to(roomId).emit(events.USER_TYPING, {
        userId,
        username,
        roomId
      });
    });

    // User stopped typing
    socket.on(events.USER_STOP_TYPING, (data) => {
      const { roomId, userId } = data;
      socket.to(roomId).emit(events.USER_STOP_TYPING, {
        userId,
        roomId
      });
    });

    // Mark message as read
    socket.on(events.MESSAGE_READ, async (data) => {
      try {
        const { messageIds, roomId, readerId } = data;
        
        // Update messages as read in database
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $set: { read: true } }
        );
        
        // Notify other users in the room
        socket.to(roomId).emit(events.MESSAGE_READ, {
          messageIds,
          readerId,
          roomId
        });
        
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Create a new room (for group chats)
    socket.on(events.CREATE_ROOM, async (roomData) => {
      try {
        const { roomId, roomName, createdBy } = roomData;
        
        // Get creator info
        const creator = await User.findById(createdBy);
        if (!creator) {
          socket.emit(events.ERROR, { message: 'Creator not found' });
          return;
        }
        
        // Create room and join it
        socket.join(roomId);
        
        // Create a system message
        const systemMessage = new Message({
          sender: createdBy,
          senderName: 'System',
          receiver: 'all',
          message: `Room "${roomName}" created by ${creator.username}`,
          room: roomId,
          messageType: 'system',
          timestamp: new Date()
        });
        
        await systemMessage.save();
        
        // Notify all users about new room
        io.emit(events.ROOM_CREATED, {
          roomId,
          roomName,
          createdBy: creator.username,
          createdAt: new Date()
        });
        
      } catch (error) {
        console.error('Error creating room:', error);
        socket.emit(events.ERROR, { message: 'Failed to create room' });
      }
    });

    // Handle user status change
    socket.on('user_status_change', async (data) => {
      try {
        const { userId, status } = data;
        
        const user = await User.findByIdAndUpdate(
          userId,
          { status, lastSeen: new Date() },
          { new: true }
        );
        
        if (user) {
          // Update in active users
          if (activeUsers.has(userId)) {
            activeUsers.get(userId).status = status;
          }
          
          // Broadcast status change
          io.emit('user_status_updated', {
            userId,
            status,
            username: user.username
          });
        }
        
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    });

    // Handle disconnection
    socket.on(events.DISCONNECT, async () => {
      const userId = socket.userId;
      
      if (userId) {
        // Update user status in database
        try {
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date(),
            socketId: null
          });
        } catch (error) {
          console.error('Error updating user offline status:', error);
        }
        
        // Remove from active users
        if (activeUsers.has(userId)) {
          const user = activeUsers.get(userId);
          console.log(`👋 ${user.username} (${userId}) disconnected`);
          
          activeUsers.delete(userId);
          userRooms.delete(userId);
        }
        
        // Get updated users list from database
        try {
          const allUsers = await User.find({}, {
            username: 1,
            avatar: 1,
            isOnline: 1,
            status: 1,
            lastSeen: 1
          }).lean();
          
          // Broadcast updated users list
          io.emit(events.GET_ONLINE_USERS, allUsers);
        } catch (error) {
          console.error('Error fetching users on disconnect:', error);
        }
      }
    });
  });
};