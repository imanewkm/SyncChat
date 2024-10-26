import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const Chat = ({ contactId }) => {
    const [socket] = useState(() => io("http://localhost:5500"));
    const [message, setMessage] = useState("");  // Message currently being typed
    const [typingMessage, setTypingMessage] = useState("");
    const [chatMessages, setChatMessages] = useState([]);  // All chat messages

    useEffect(() => {
        // Join chat room
        socket.emit("joinChat", contactId);

        // Load initial messages for the chat
        socket.on("messages", (messages) => {
            setChatMessages(messages);
        });

        // Update typing indicator in real time
        socket.on("typing", ({ sender, text }) => {
            setTypingMessage(`${sender} is typing: ${text}`);
        });

        // Update chat with new incoming messages
        socket.on("message", (newMessage) => {
            setChatMessages((prevMessages) => [...prevMessages, newMessage]);
            setTypingMessage("");  // Clear typing message when message is received
        });

        return () => {
            if (socket) socket.disconnect();
        };
    }, [contactId, socket]);

    // Handle typing indicator
    const handleTyping = (e) => {
        setMessage(e.target.value);
        socket.emit("typing", { contactId, sender: "User", text: e.target.value });
    };

    // Send message and clear input field
    const sendMessage = () => {
        if (message.trim()) {
            socket.emit("message", { contactId, sender: "User", text: message });
            setMessage("");  // Clear message input
        }
    };

    return (
        <div>
            <div>
                {chatMessages.map((message, index) => (
                    <div key={index}>
                        <p>{message.sender}: {message.text}</p>
                    </div>
                ))}
            </div>
            <input
                type="text"
                value={message}
                onChange={handleTyping}
                placeholder="Type a message..."
            />
            <button onClick={sendMessage}>Send</button>
            <p>{typingMessage}</p>
        </div>
    );
};

export default Chat;
