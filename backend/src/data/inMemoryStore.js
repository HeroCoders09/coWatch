export const rooms = new Map();
/*
rooms map shape:
roomId => {
  roomId,
  roomName,
  adminSocketId,
  users: Map<socketId, { socketId, userName, isAdmin }>
}
*/