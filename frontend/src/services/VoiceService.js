class VoiceService {
  constructor() {
    this.recognition = null;
    this.synthesis = null;
    this.isListening = false;
    this.isSupported = false;
    this.onResult = null;
    this.onError = null;
    this.onStart = null;
    this.onEnd = null;
    
    this.initializeServices();
  }

  initializeServices() {
    // Check for speech recognition support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
      this.isSupported = true;
    }

    // Check for speech synthesis support
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }
  }

  setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onStart) this.onStart();
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (this.onResult) this.onResult(transcript);
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      if (this.onError) this.onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEnd) this.onEnd();
    };
  }

  startListening() {
    if (!this.isSupported || !this.recognition) {
      throw new Error('Speech recognition not supported');
    }

    if (this.isListening) {
      this.stopListening();
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      if (this.onError) this.onError('Failed to start listening');
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  speak(text, options = {}) {
    if (!this.synthesis) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice options
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;

    // Try to use a pleasant voice
    const voices = this.synthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.name.includes('Samantha')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      if (options.onStart) options.onStart();
    };

    utterance.onend = () => {
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      if (options.onError) options.onError(event.error);
    };

    this.synthesis.speak(utterance);
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  isSpeaking() {
    return this.synthesis && this.synthesis.speaking;
  }

  getAvailableVoices() {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices();
  }

  setLanguage(lang) {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  // Event handlers
  setOnResult(callback) {
    this.onResult = callback;
  }

  setOnError(callback) {
    this.onError = callback;
  }

  setOnStart(callback) {
    this.onStart = callback;
  }

  setOnEnd(callback) {
    this.onEnd = callback;
  }
}

export default VoiceService;
