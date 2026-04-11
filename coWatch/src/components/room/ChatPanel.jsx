import { useState, useEffect, useRef } from "react";
import socket from "../../socket";

export default function ChatPanel({ roomId, currentUserName }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;

    socket.emit("join_room", roomId);

    const handleMessage = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on("receive_message", handleMessage);

    return () => {
      socket.off("receive_message", handleMessage);
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim() || !roomId) return;

    const msgData = {
      roomId,
      user: currentUserName,
      message,
    };

    socket.emit("send_message", msgData);

    setMessage("");
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white p-4 rounded-xl">
      
      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {messages.map((msg, index) => (
          <div key={index} className="text-sm">
            <span className="font-semibold">{msg.user}: </span>
            {msg.message}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 p-2 rounded bg-gray-800 outline-none"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}