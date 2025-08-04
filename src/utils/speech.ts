export class SpeechManager {
  private synthesis: SpeechSynthesis;
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private currentLanguage: 'tamil' | 'english' = 'tamil';
  private speechQueue: Array<{
    text: string;
    onStart?: () => void;
    onEnd?: () => void;
    priority?: number; // Higher number = higher priority
  }> = [];
  private isProcessingQueue = false;
  private distanceThreshold = 10; // 10 meters threshold

  constructor() {
    this.synthesis = window.speechSynthesis;
    
    // Initialize speech recognition if available
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    } else if ('SpeechRecognition' in window) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'ta-IN';
    }
  }

  setLanguage(language: 'tamil' | 'english') {
    this.currentLanguage = language;
    if (this.recognition) {
      this.recognition.lang = language === 'tamil' ? 'ta-IN' : 'en-US';
    }
  }

  // Set distance threshold for navigation instructions
  setDistanceThreshold(threshold: number) {
    this.distanceThreshold = threshold;
  }

  // Check if distance is within threshold for navigation instructions
  shouldSpeakNavigationInstruction(distance: number): boolean {
    return distance <= this.distanceThreshold;
  }

  // Add speech to queue with optional priority
  speak(text: string, onStart?: () => void, onEnd?: () => void, priority: number = 0): Promise<void> {
    return new Promise((resolve) => {
      const speechItem = {
        text,
        onStart,
        onEnd: () => {
          onEnd && onEnd();
          resolve();
        },
        priority
      };

      // For high priority messages (like initial navigation), speak immediately
      if (priority >= 2) {
        // Clear current speech and queue
        if (this.synthesis.speaking) {
          this.synthesis.cancel();
        }
        this.speechQueue = [];
        this.isProcessingQueue = false;
        
        // Speak immediately
        this.speakImmediate(text, onStart, () => {
          onEnd && onEnd();
          resolve();
        });
        return;
      }

      // Add to queue and sort by priority (higher priority first)
      this.speechQueue.push(speechItem);
      this.speechQueue.sort((a, b) => (b.priority || 0) - (a.priority || 0));

      // Start processing queue if not already processing
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  // Process the speech queue
  private async processQueue() {
    if (this.isProcessingQueue || this.speechQueue.length === 0) {
      return;
    }

    console.log(`Processing speech queue with ${this.speechQueue.length} items`);
    this.isProcessingQueue = true;

    while (this.speechQueue.length > 0) {
      const speechItem = this.speechQueue.shift();
      if (!speechItem) continue;

      console.log(`Speaking: "${speechItem.text.substring(0, 50)}..." (priority: ${speechItem.priority})`);
      await this.speakImmediate(speechItem.text, speechItem.onStart, speechItem.onEnd);
    }

    console.log('Speech queue processing completed');
    this.isProcessingQueue = false;
  }

  // Immediate speech without queue (for urgent messages)
  private speakImmediate(text: string, onStart?: () => void, onEnd?: () => void): Promise<void> {
    return new Promise((resolve) => {
      if (this.synthesis.speaking) {
        this.synthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Get only female voices
      const voices = this.synthesis.getVoices();
      const femaleVoice = voices.find(voice => {
        const voiceName = voice.name.toLowerCase();
        const isCorrectLanguage = this.currentLanguage === 'tamil' 
          ? voice.lang.includes('ta') || voice.lang.includes('hi') || voice.lang.includes('en-in') // Use Indian English for better Tamil pronunciation
          : voice.lang.includes('en');
        const isFemale = voiceName.includes('female') || 
                        voiceName.includes('woman') || 
                        voiceName.includes('samantha') ||
                        voiceName.includes('zira') ||
                        voiceName.includes('susan') ||
                        voiceName.includes('karen') ||
                        voiceName.includes('veena') ||
                        voiceName.includes('raveena') ||
                        voiceName.includes('google') && !voiceName.includes('male');
        return isCorrectLanguage && isFemale;
      }) || voices.find(voice => 
        this.currentLanguage === 'tamil' 
          ? voice.lang.includes('ta') || voice.lang.includes('hi') || voice.lang.includes('en-in')
          : voice.lang.includes('en')
      ) || voices[0];
      
      utterance.voice = femaleVoice;
      
      utterance.rate = this.currentLanguage === 'tamil' ? 0.9 : 1.2; // Slower Tamil for better pronunciation
      utterance.pitch = 1.1;
      utterance.volume = 0.8;
      utterance.lang = this.currentLanguage === 'tamil' ? 'en-IN' : 'en-US'; // Use Indian English for Tamil words

      utterance.onstart = () => {
        onStart && onStart();
      };

      utterance.onend = () => {
        onEnd && onEnd();
        resolve();
      };

      this.synthesis.speak(utterance);
    });
  }

  // Clear the speech queue
  clearQueue() {
    this.speechQueue = [];
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }
  }

  // Get queue length
  get queueLength(): number {
    return this.speechQueue.length;
  }

  // Get queue status for debugging
  getQueueStatus(): Array<{ text: string; priority: number }> {
    return this.speechQueue.map(item => ({
      text: item.text.substring(0, 50) + (item.text.length > 50 ? '...' : ''),
      priority: item.priority || 0
    }));
  }

  // Check if currently speaking
  get isSpeaking(): boolean {
    return this.synthesis.speaking || this.isProcessingQueue;
  }

  // Check if speech system is busy (speaking or queue has items)
  get isBusy(): boolean {
    return this.isSpeaking || this.queueLength > 0;
  }

  listen(onResult: (transcript: string) => void, onError?: (error: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        const error = 'Speech recognition not supported';
        onError && onError(error);
        reject(error);
        return;
      }

      if (this.isListening) {
        this.recognition.stop();
      }

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        this.isListening = false;
        resolve();
      };

      this.recognition.onerror = (event) => {
        const error = `Speech recognition error: ${event.error}`;
        onError && onError(error);
        this.isListening = false;
        reject(error);
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };

      this.recognition.start();
      this.isListening = true;
    });
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  stopSpeaking() {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }
    // Clear the queue when stopping speech
    this.clearQueue();
  }

  get isRecognitionSupported(): boolean {
    return this.recognition !== null;
  }

  get isSpeechSupported(): boolean {
    return 'speechSynthesis' in window;
  }
}