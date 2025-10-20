import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import MicButton from "./MicButton";
import CameraButton from "./CameraButton";

const ChatInput = ({ onSend, onImage, onVoice }) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);

  const handleSend = () => {
    if (!message.trim()) return;
    onSend(message);
    setMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  return (
    <div className="chat-input-container">
      <div className="chat-input-wrapper">
        <div className="chat-input-box">
          {/* Camera button */}
          <CameraButton onImageCapture={onImage} />

          {/* Textarea input */}
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            rows={1}
            placeholder="Message HAL's Penny..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
          />

          {/* Mic button */}
          <MicButton onTranscription={onVoice} />

          {/* Send button */}
          <button
            onClick={handleSend}
            className="send-button"
            title="Send"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      <p className="chat-disclaimer">
        HAL's Penny can make mistakes — check important info.
      </p>
    </div>
  );
};

export default ChatInput;
