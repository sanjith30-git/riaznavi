export interface Building {
  name: string;
  englishName?: string;
  lat: number;
  lng: number;
  description?: string;
  image?: string;
}

export interface Buildings {
  [key: string]: Building;
}

export interface CustomLocation {
  id: string;
  name: string;
  englishName: string;
  lat: number;
  lng: number;
  description: string;
  createdAt: Date;
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
}

export interface NavigationState {
  currentStep: 'welcome' | 'selecting' | 'navigating' | 'arrived';
  selectedDestination: string | null;
  isListening: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  language: 'tamil' | 'english';
  isARMode: boolean;
  cameraPermission: boolean;
}