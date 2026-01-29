const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores']
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  socketId: {
    type: String,
    default: null
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  avatar: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['available', 'busy', 'away', 'offline'],
    default: 'available'
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ username: 1 });
userSchema.index({ isOnline: 1 });
userSchema.index({ lastSeen: -1 });
userSchema.index({ email: 1 });

// Virtual for formatted last seen
userSchema.virtual('lastSeenFormatted').get(function() {
  const now = new Date();
  const diffMs = now - this.lastSeen;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return `${Math.floor(diffMins / 1440)}d ago`;
});

// Method to update online status
userSchema.methods.updateOnlineStatus = async function(isOnline) {
  this.isOnline = isOnline;
  this.lastSeen = new Date();
  return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;