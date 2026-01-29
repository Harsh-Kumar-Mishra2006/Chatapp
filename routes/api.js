const express = require('express');
const mongoose = require('mongoose'); // Add this
const router = express.Router();
const Message = require('../model/Message');
const User = require('../model/User'); // Fixed path

// User registration endpoint
router.post('/users/register', async (req, res) => {
  try {
    const { username, email } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Username or email already exists'
      });
    }
    
    // Create new user
    const user = new User({
      username,
      email,
      isOnline: false,
      status: 'available'
    });
    
    await user.save();
    
    // Don't send password or sensitive info
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      status: user.status,
      createdAt: user.createdAt
    };
    
    res.status(201).json({
      success: true,
      user: userResponse,
      message: 'User registered successfully'
    });
    
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user',
      message: error.message
    });
  }
});

// Get all users (for contact list)
router.get('/users', async (req, res) => {
  try {
    const { search = '', limit = 50, offset = 0 } = req.query;
    
    const query = {};
    if (search) {
      query.username = { $regex: search, $options: 'i' };
    }
    
    const users = await User.find(query, {
      username: 1,
      avatar: 1,
      isOnline: 1,
      status: 1,
      lastSeen: 1
    })
    .sort({ isOnline: -1, username: 1 })
    .skip(parseInt(offset))
    .limit(parseInt(limit))
    .lean();
    
    const totalUsers = await User.countDocuments(query);
    
    res.json({
      success: true,
      users,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: totalUsers,
        hasMore: parseInt(offset) + parseInt(limit) < totalUsers
      }
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// Get user by ID
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId, {
      username: 1,
      avatar: 1,
      isOnline: 1,
      status: 1,
      lastSeen: 1,
      createdAt: 1
    }).lean();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user
    });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
});

// Update user status
router.put('/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, isOnline } = req.body;
    
    const updateData = {};
    if (status) updateData.status = status;
    if (isOnline !== undefined) {
      updateData.isOnline = isOnline;
      updateData.lastSeen = new Date();
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: 'username avatar isOnline status lastSeen' }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user,
      message: 'User status updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user status'
    });
  }
});

// [Keep all your existing message endpoints...]
// Get all messages for a specific room with pagination
router.get('/messages/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    // Input validation
    const pageLimit = Math.min(parseInt(limit), 100);
    const pageOffset = Math.max(parseInt(offset), 0);
    
    const messages = await Message.find({ room: roomId })
      .sort({ timestamp: -1 })
      .skip(pageOffset)
      .limit(pageLimit)
      .lean();
    
    const totalMessages = await Message.countDocuments({ room: roomId });
    
    res.json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        limit: pageLimit,
        offset: pageOffset,
        total: totalMessages,
        hasMore: pageOffset + pageLimit < totalMessages
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages',
      message: error.message
    });
  }
});

// Get unread messages count for a user
router.get('/messages/unread/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const unreadCount = await Message.countDocuments({
      receiver: userId,
      read: false
    });
    
    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread messages count'
    });
  }
});

// Mark multiple messages as read
router.post('/messages/mark-read', async (req, res) => {
  try {
    const { messageIds, roomId, readerId } = req.body;
    
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message IDs array is required'
      });
    }
    
    const result = await Message.updateMany(
      { 
        _id: { $in: messageIds },
        receiver: readerId
      },
      { $set: { read: true } }
    );
    
    res.json({
      success: true,
      message: `${result.modifiedCount} messages marked as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to mark messages as read'
    });
  }
});

// Delete a message
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }
    
    if (message.sender !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this message'
      });
    }
    
    await Message.findByIdAndDelete(messageId);
    
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete message'
    });
  }
});

// Search messages in a room
router.get('/messages/search/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { query, limit = 20 } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }
    
    const messages = await Message.find({
      room: roomId,
      message: { $regex: query, $options: 'i' }
    })
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .lean();
    
    res.json({
      success: true,
      messages,
      count: messages.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

// Health check endpoint with DB status
router.get('/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    res.json({
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      database: {
        status: dbStates[dbStatus] || 'unknown',
        readyState: dbStatus
      },
      memory: process.memoryUsage()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;