module.exports = {
  // Connection events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // User events
  USER_JOIN: 'user_join',
  USER_LEAVE: 'user_leave',
  USER_TYPING: 'user_typing',
  USER_STOP_TYPING: 'user_stop_typing',
  GET_ONLINE_USERS: 'get_online_users',
  
  // Message events
  SEND_MESSAGE: 'send_message',
  RECEIVE_MESSAGE: 'receive_message',
  MESSAGE_DELIVERED: 'message_delivered',
  MESSAGE_READ: 'message_read',
  
  // Room events
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  CREATE_ROOM: 'create_room',
  ROOM_CREATED: 'room_created',
  
  // Error events
  ERROR: 'error'
};