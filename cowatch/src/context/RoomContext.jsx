import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

const RoomContext = createContext(null);

const AVATAR_COLORS = [
  "bg-gradient-to-br from-pink-500 to-rose-500",
  "bg-gradient-to-br from-purple-500 to-indigo-500",
  "bg-gradient-to-br from-blue-500 to-cyan-500",
  "bg-gradient-to-br from-green-500 to-emerald-500",
  "bg-gradient-to-br from-yellow-500 to-orange-500",
  "bg-gradient-to-br from-red-500 to-pink-500",
];

// Simulated rooms storage (in a real app, this would be in a database)
const roomsStorage = new Map();

export const RoomProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const syncIntervalRef = useRef(null);

  const getRandomAvatar = () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  const createRoom = useCallback(async (name, password, username) => {
    setConnectionStatus("connecting");

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const roomId = uuidv4().slice(0, 8).toUpperCase();
    const userId = uuidv4();

    const user = {
      id: userId,
      username,
      avatar: getRandomAvatar(),
      isAdmin: true,
      joinedAt: new Date(),
    };

    const newRoom = {
      id: roomId,
      name,
      password,
      adminId: userId,
      users: [user],
      videoUrl: null,
      videoState: {
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        lastUpdated: Date.now(),
      },
      createdAt: new Date(),
    };

    roomsStorage.set(roomId, newRoom);
    setCurrentUser(user);
    setRoom(newRoom);
    setConnectionStatus("connected");

    // Add system message
    const systemMessage = {
      id: uuidv4(),
      userId: "system",
      username: "System",
      avatar: "",
      content: `Room "${name}" created! Share the Room ID: ${roomId}`,
      timestamp: new Date(),
      type: "system",
    };
    setMessages([systemMessage]);

    return roomId;
  }, []);

  const joinRoom = useCallback(async (roomId, password, username) => {
    setConnectionStatus("connecting");

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const existingRoom = roomsStorage.get(roomId.toUpperCase());

    if (!existingRoom) {
      setConnectionStatus("error");
      return false;
    }

    if (existingRoom.password !== password) {
      setConnectionStatus("error");
      return false;
    }

    const userId = uuidv4();
    const user = {
      id: userId,
      username,
      avatar: getRandomAvatar(),
      isAdmin: false,
      joinedAt: new Date(),
    };

    existingRoom.users.push(user);
    roomsStorage.set(roomId.toUpperCase(), existingRoom);

    setCurrentUser(user);
    setRoom(existingRoom);
    setConnectionStatus("connected");

    // Add join message
    const joinMessage = {
      id: uuidv4(),
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      content: `${username} joined the room`,
      timestamp: new Date(),
      type: "join",
    };
    setMessages((prev) => [...prev, joinMessage]);

    return true;
  }, []);

  const leaveRoom = useCallback(() => {
    if (room && currentUser) {
      const updatedRoom = { ...room };
      updatedRoom.users = updatedRoom.users.filter((u) => u.id !== currentUser.id);
      roomsStorage.set(room.id, updatedRoom);
    }

    setCurrentUser(null);
    setRoom(null);
    setMessages([]);
    setConnectionStatus("disconnected");

    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }
  }, [room, currentUser]);

  const sendMessage = useCallback(
    (content) => {
      if (!currentUser) return;

      const message = {
        id: uuidv4(),
        userId: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar,
        content,
        timestamp: new Date(),
        type: "message",
      };

      setMessages((prev) => [...prev, message]);
    },
    [currentUser]
  );

  const updateVideoState = useCallback(
    (state) => {
      if (!room || !currentUser?.isAdmin) return;

      const updatedRoom = {
        ...room,
        videoState: {
          ...room.videoState,
          ...state,
          lastUpdated: Date.now(),
        },
      };

      roomsStorage.set(room.id, updatedRoom);
      setRoom(updatedRoom);
    },
    [room, currentUser]
  );

  const setVideoUrl = useCallback(
    (url) => {
      if (!room || !currentUser?.isAdmin) return;

      const updatedRoom = {
        ...room,
        videoUrl: url,
        videoState: {
          isPlaying: false,
          currentTime: 0,
          duration: 0,
          lastUpdated: Date.now(),
        },
      };

      roomsStorage.set(room.id, updatedRoom);
      setRoom(updatedRoom);

      const systemMessage = {
        id: uuidv4(),
        userId: "system",
        username: "System",
        avatar: "",
        content: "Admin loaded a new video",
        timestamp: new Date(),
        type: "system",
      };
      setMessages((prev) => [...prev, systemMessage]);
    },
    [room, currentUser]
  );

  const syncVideoTime = useCallback(
    (time) => {
      if (!room) return;

      const updatedRoom = {
        ...room,
        videoState: {
          ...room.videoState,
          currentTime: time,
          lastUpdated: Date.now(),
        },
      };

      roomsStorage.set(room.id, updatedRoom);
      setRoom(updatedRoom);
    },
    [room]
  );

  // Simulate real-time sync by polling room state
  useEffect(() => {
    if (room && connectionStatus === "connected") {
      syncIntervalRef.current = setInterval(() => {
        const latestRoom = roomsStorage.get(room.id);
        if (latestRoom) {
          setRoom(latestRoom);
        }
      }, 500);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [room?.id, connectionStatus]);

  return (
    <RoomContext.Provider
      value={{
        currentUser,
        room,
        messages,
        connectionStatus,
        createRoom,
        joinRoom,
        leaveRoom,
        sendMessage,
        updateVideoState,
        setVideoUrl,
        syncVideoTime,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return context;
};