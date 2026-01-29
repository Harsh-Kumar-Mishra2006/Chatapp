// Generate a unique room ID for private chats
const generatePrivateRoomId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('_');
};

// Generate a unique ID for group chats
const generateGroupRoomId = () => {
  return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Format message timestamp
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Validate message data
const validateMessage = (messageData) => {
  const { senderId, receiverId, message, roomId } = messageData;
  
  if (!senderId || !receiverId || !message || !roomId) {
    return false;
  }
  
  if (message.trim().length === 0) {
    return false;
  }
  
  return true;
};

module.exports = {
  generatePrivateRoomId,
  generateGroupRoomId,
  formatTimestamp,
  validateMessage
};