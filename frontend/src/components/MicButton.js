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
    >
      {isRecording ? (
        <MicOff size={18} />
      ) : (
        <Mic size={18} />
      )}
    </button>
  );
};

export default MicButton;
