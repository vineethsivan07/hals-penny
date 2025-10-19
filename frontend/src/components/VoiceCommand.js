import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import VoiceService from '../services/VoiceService';
import './VoiceCommand.css';

const VoiceCommand = forwardRef(({ onVoiceResult, onVoiceError, disabled = false }, ref) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);
  const [transcript, setTranscript] = useState('');
  const voiceService = useRef(null);

  useEffect(() => {
    // Initialize voice service
    voiceService.current = new VoiceService();
    
    // Check if voice services are supported
    setIsSupported(voiceService.current.isSupported);

    // Set up event handlers
    voiceService.current.setOnResult((text) => {
      setTranscript(text);
      setIsListening(false);
      if (onVoiceResult) {
        onVoiceResult(text);
      }
    });

    voiceService.current.setOnError((error) => {
      setIsListening(false);
      setError(error);
      if (onVoiceError) {
        onVoiceError(error);
      }
    });

    voiceService.current.setOnStart(() => {
      setIsListening(true);
      setError(null);
      setTranscript('');
    });

    voiceService.current.setOnEnd(() => {
      setIsListening(false);
    });

    // Cleanup on unmount
    return () => {
      if (voiceService.current) {
        voiceService.current.stopListening();
        voiceService.current.stopSpeaking();
      }
    };
  }, [onVoiceResult, onVoiceError]);

  const handleVoiceToggle = () => {
    if (disabled || !isSupported) return;

    try {
      if (isListening) {
        voiceService.current.stopListening();
      } else {
        voiceService.current.startListening();
      }
    } catch (error) {
      setError('Failed to start voice recognition');
      console.error('Voice recognition error:', error);
    }
  };

  const speak = (text, options = {}) => {
    if (!voiceService.current || disabled) return;

    voiceService.current.speak(text, {
      ...options,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: (error) => {
        setIsSpeaking(false);
        setError('Speech synthesis failed');
        console.error('Speech synthesis error:', error);
      }
    });
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    speak: speak,
    handleVoiceToggle: handleVoiceToggle
  }));

  const stopSpeaking = () => {
    if (voiceService.current) {
      voiceService.current.stopSpeaking();
      setIsSpeaking(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="voice-command-unsupported">
        <span className="voice-icon">🎤</span>
        <span className="voice-text">Voice not supported</span>
      </div>
    );
  }

  return (
    <div className="voice-command">
      <button
        className={`voice-button ${isListening ? 'listening' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleVoiceToggle}
        disabled={disabled}
        title={isListening ? 'Stop listening' : 'Start voice input'}
      >
        <span className="voice-icon">
          {isListening ? '🔴' : '🎤'}
        </span>
        <span className="voice-text">
          {isListening ? 'Listening...' : 'Voice'}
        </span>
      </button>

      {isSpeaking && (
        <button
          className="stop-speaking-button"
          onClick={stopSpeaking}
          title="Stop speaking"
        >
          <span className="stop-icon">⏹️</span>
        </button>
      )}

      {transcript && (
        <div className="voice-transcript">
          <span className="transcript-label">You said:</span>
          <span className="transcript-text">"{transcript}"</span>
        </div>
      )}

      {error && (
        <div className="voice-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
        </div>
      )}

    </div>
  );
});

export default VoiceCommand;
