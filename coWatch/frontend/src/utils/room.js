export function generateRoomId(length = 8) {
  return Math.random().toString(36).slice(2, 2 + length).toUpperCase();
}

export function buildInviteLink(roomId) {
  return `${window.location.origin}/join/${roomId}`;
}