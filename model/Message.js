const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender ID is required']
  },
  senderName: {
    type: String,
    required: [true, 'Sender name is required'],
    trim: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Receiver ID is required']
  },
  message: {
    type: String,
    required: [true, 'Message text is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  room: {
    type: String,
    required: [true, 'Room ID is required'],
    trim: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  read: {
    type: Boolean,
    default: false
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  attachment: {
    url: String,
    filename: String,
    size: Number,
    mimeType: String
  }
}, {
  timestamps: true
});

// Compound index for common query patterns
messageSchema.index({ room: 1, timestamp: -1 });
messageSchema.index({ receiver: 1, read: 1 });
messageSchema.index({ sender: 1, receiver: 1 });

// Virtual for formatted timestamp
messageSchema.virtual('timeFormatted').get(function() {
  return this.timestamp.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;