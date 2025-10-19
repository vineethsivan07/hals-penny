import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react"; // optional icons (shadcn/lucide)
import './ChatInterface.css';

const MicButton = ({ onTranscription }) => {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);


  useEffect(() => {
    // Web Speech API setup
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onTranscription(transcript); // send text to parent
    };

    recognition.onerror = (err) => {
      console.error("Speech recognition error:", err);
      setIsRecording(false);
    };

    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
  }, [onTranscription]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  return (
    <button
      onClick={toggleRecording}
      className={`mic-button ${isRecording ? 'recording' : ''}`}
      title={isRecording ? "Listening..." : "Click to speak"}
      style={{
        background: isRecording ? '#ef4444' : '#10b981',
        color: 'white',
        border: 'none',
        padding: '0.8rem',
        borderRadius: '20px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '50px',
        height: '50px'
      }}
    >
      {isRecording ? (
        <MicOff size={20} />
      ) : (
        <Mic size={20} />
      )}
    </button>
  );
};

export default MicButton;
