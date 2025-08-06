import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, MapPin, Navigation, Clock, Globe, Camera, X, Maximize2, ArrowLeft, Settings, Map } from 'lucide-react';
import { BotAnimation } from './BotAnimation';
import { ChatBubble } from './ChatBubble';
import { DestinationGrid } from './DestinationGrid';
import { NavigationMap } from './NavigationMap';
import { ARCamera } from './ARCamera';
import { SplashScreen } from './SplashScreen';
import { SettingsModal } from './SettingsModal';
import { LocationErrorModal } from './LocationErrorModal';
import { LocationNotification } from './LocationNotification';
import { NavigationStatus } from './NavigationStatus';
import { DestinationImage } from './DestinationImage';
import { CustomRoutesGrid } from './CustomRoutesGrid';
import { SpeechManager } from '../utils/speech';
import { LocationService, LocationErrorType } from '../utils/locationService';
import { getTranslation } from '../utils/translations';
import { buildings } from '../data/campus';
import { CustomLocationsManager } from '../utils/customLocations';
import { ChatMessage, NavigationState } from '../types';

export const NavigationBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showSplash, setShowSplash] = useState(true);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [navState, setNavState] = useState<NavigationState>({
    currentStep: 'welcome',
    selectedDestination: null,
    isListening: false,
    isSpeaking: false,
    isMuted: false,
    language: 'english', // Default to English
    isARMode: false,
    cameraPermission: false
  });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [currentInstruction, setCurrentInstruction] = useState<string>('');
  const [currentDistance, setCurrentDistance] = useState<number | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false); // Prevent multiple operations
  const [navigationMode, setNavigationMode] = useState<'none' | 'map' | 'ar' | 'split'>('none');
  const [lastSpokenInstruction, setLastSpokenInstruction] = useState<string>('');
  const [lastSpeechTime, setLastSpeechTime] = useState<number>(0);
  const [isRouteCalculating, setIsRouteCalculating] = useState(false);
  const [hasSpokenRouteCalculated, setHasSpokenRouteCalculated] = useState(false);
  const [showMapControls, setShowMapControls] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [locationError, setLocationError] = useState<{ type: LocationErrorType; isOpen: boolean } | null>(null);
  const [locationNotification, setLocationNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    isVisible: boolean;
  } | null>(null);
  
  const [navigationStatus, setNavigationStatus] = useState<{
    isVisible: boolean;
    type: 'cancelled' | 'new-destination' | 'calculating' | 'error';
    message: string;
  } | null>(null);
  
  const [showDestinationImage, setShowDestinationImage] = useState(false);
  const [showCustomRoutes, setShowCustomRoutes] = useState(false);
  const [selectedCustomRoute, setSelectedCustomRoute] = useState<string | null>(null);
  
  const speechManagerRef = useRef<SpeechManager | null>(null);
  const locationServiceRef = useRef<LocationService | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showSplash) return;
    
    speechManagerRef.current = new SpeechManager();
    speechManagerRef.current.setLanguage(navState.language);
    speechManagerRef.current.setDistanceThreshold(10); // Set 10 meter threshold
    
    // Initialize location service
    locationServiceRef.current = LocationService.getInstance();
    
    // Use default campus center location (will be updated by map's location detection)
    setUserLocation({ lat: 12.192850, lng: 79.083730 });

    // Initial welcome message
    const welcomeMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'bot',
      content: getTranslation('welcome', navState.language),
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    
    // Speak welcome message
    setTimeout(() => {
      speakMessage(welcomeMessage.content);
    }, 2000);

  }, [showSplash, navState.language]);

  useEffect(() => {
    // Auto-scroll to latest message
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleLanguage = () => {
    const newLanguage = navState.language === 'tamil' ? 'english' : 'tamil';
    setNavState(prev => ({ ...prev, language: newLanguage }));
    speechManagerRef.current?.setLanguage(newLanguage);
    
    const message = addMessage('bot', getTranslation('welcome', newLanguage));
    speakMessage(message.content);
  };

  const toggleARMode = () => {
    setNavState(prev => ({ ...prev, isARMode: !prev.isARMode }));
  };

  const addMessage = (type: 'bot' | 'user', content: string) => {
    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
    return message;
  };

  const speakMessage = async (text: string, priority: number = 0) => {
    if (!speechManagerRef.current?.isSpeechSupported || navState.isMuted) return;
    
    setNavState(prev => ({ ...prev, isSpeaking: true }));
    
    try {
      await speechManagerRef.current.speak(
        text,
        () => setNavState(prev => ({ ...prev, isSpeaking: true })),
        () => setNavState(prev => ({ ...prev, isSpeaking: false })),
        priority
      );
    } catch (error) {
      setNavState(prev => ({ ...prev, isSpeaking: false }));
    }
  };

  const toggleMute = () => {
    setNavState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    if (!navState.isMuted) {
      speechManagerRef.current?.stopSpeaking();
      speechManagerRef.current?.clearQueue();
    }
  };

  const startListening = async () => {
    if (isProcessing || navState.isListening || speechManagerRef.current?.isBusy) {
      console.log('Cannot start listening: operation in progress');
      return; // Prevent multiple operations
    }
    
    if (!speechManagerRef.current?.isRecognitionSupported) {
      const message = addMessage('bot', getTranslation('speechNotSupported', navState.language));
      speakMessage(message.content);
      return;
    }

    // Stop any current speech before listening
    speechManagerRef.current?.stopSpeaking();
    setNavState(prev => ({ ...prev, isSpeaking: false }));

    setNavState(prev => ({ ...prev, isListening: true }));
    
    try {
      await speechManagerRef.current.listen(
        (transcript) => {
          addMessage('user', transcript);
          processVoiceInput(transcript);
          setNavState(prev => ({ ...prev, isListening: false }));
        },
        (error) => {
          console.error('Speech recognition error:', error);
          const errorMessage = addMessage('bot', getTranslation('cameraError', navState.language));
          speakMessage(errorMessage.content);
          setNavState(prev => ({ ...prev, isListening: false }));
        }
      );
    } catch (error) {
      setNavState(prev => ({ ...prev, isListening: false }));
    }
  };

  const processVoiceInput = (transcript: string) => {
    const lowerTranscript = transcript.toLowerCase();
    
    // Try to match building names
    const matchedBuilding = Object.entries(buildings).find(([key, building]) => 
      lowerTranscript.includes(building.name.toLowerCase()) ||
      lowerTranscript.includes((building.englishName || '').toLowerCase()) ||
      lowerTranscript.includes(key.toLowerCase())
    );

    if (matchedBuilding) {
      handleDestinationSelect(matchedBuilding[0]);
    } else {
      const response = addMessage('bot', getTranslation('didNotCatch', navState.language));
      speakMessage(response.content);
    }
  };

  const handleDestinationSelect = (destinationKey: string) => {
    // Prevent multiple simultaneous operations and clear any existing timeouts
    if (isProcessing || speechManagerRef.current?.isBusy || navState.isListening || isRouteCalculating) {
      console.log('Operation already in progress, ignoring click');
      return;
    }
    
    setIsProcessing(true);
    setIsRouteCalculating(true);
    setHasSpokenRouteCalculated(false);
    
    // Stop any current speech and clear queue immediately
    speechManagerRef.current?.stopSpeaking();
    speechManagerRef.current?.clearQueue();
    speechManagerRef.current?.stopListening();
    
    // Clear any ongoing navigation state
    setCurrentInstruction('');
    setLastSpokenInstruction('');
    setLastSpeechTime(0);
    
    // Check if it's a regular building or custom location
    const building = buildings[destinationKey];
    const customLocationsManager = CustomLocationsManager.getInstance();
    const customLocations = customLocationsManager.getCustomLocationsAsBuildings();
    const customLocation = customLocations[destinationKey];
    
    // Use building or custom location data
    const destinationData = building || customLocation;
    if (!destinationData) {
      console.log('Destination not found:', destinationKey);
      setIsProcessing(false);
      return;
    }

    // Show destination image if available
    if (destinationData.image) {
      setShowDestinationImage(true);
    }

    // Show calculating status
    setNavigationStatus({
      isVisible: true,
      type: 'calculating',
      message: navState.language === 'tamil' 
        ? 'வழி கணக்கிடப்படுகிறது...'
        : 'Calculating route...'
    });
    
    setNavState(prev => ({ 
      ...prev, 
      selectedDestination: destinationKey,
      currentStep: 'navigating',
      isSpeaking: false,
      isListening: false
    }));

    const response = addMessage('bot', getTranslation('calculating', navState.language, {
      destination: navState.language === 'tamil' ? destinationData.name : (destinationData.englishName || destinationData.name),
      description: destinationData.description || ''
    })
    );
    
    setShowMap(true);
    setNavigationMode('map'); // Start with map mode
    setIsMapFullscreen(true); // Make map fullscreen on mobile
    
    // Speak message after a short delay to ensure state is updated
    setTimeout(() => {
      speakMessage(response.content);
    }, 500);
    
    // Reset processing flag after speech
    setTimeout(() => {
      setIsProcessing(false);
    }, 2000);
  };

  const toggleNavigationMode = () => {
    if (navigationMode === 'map') {
      setNavigationMode('ar');
    } else if (navigationMode === 'ar') {
      setNavigationMode('split');
    } else {
      setNavigationMode('map');
    }
  };

  const handleRouteCalculated = (distance: number, duration: number) => {
    setIsRouteCalculating(false);
    setRouteInfo({ distance, duration });
    
    // Hide calculating status
    setNavigationStatus(null);
    
    // Only speak route calculated message once
    if (!hasSpokenRouteCalculated) {
      setHasSpokenRouteCalculated(true);
      
      const distanceText = distance > 1000 
        ? `${(distance / 1000).toFixed(1)} kilometers`
        : `${Math.round(distance)} meters`;
      
      const durationText = duration > 60 
        ? `${Math.round(duration / 60)} minutes`
        : `${Math.round(duration)} seconds`;

      const response = addMessage('bot', getTranslation('routeCalculated', navState.language, {
        distance: distanceText,
        duration: durationText
      }));
      
      speakMessage(response.content, 1); // Lower priority to avoid conflicts
    }
  };

  const handleNavigationInstruction = (instruction: string, distance?: number) => {
    const now = Date.now();
    
    // Check if navigation has been cancelled - don't process instructions if no destination is selected
    if (!navState.selectedDestination) {
      console.log('Navigation cancelled, ignoring instruction:', instruction);
      return;
    }
    
    // Prevent duplicate "Navigation started" messages
    if (instruction.includes('Navigation started') && messages.some(msg => msg.content.includes('Navigation started'))) {
      console.log('Skipping duplicate navigation started message');
      return;
    }
    
    // Update current instruction and distance for AR display
    setCurrentInstruction(instruction);
    setCurrentDistance(distance);
    
    // Check for specific location error types
    if (instruction.includes('Location permission denied')) {
      handleLocationError('permission');
      return;
    } else if (instruction.includes('Location service unavailable')) {
      handleLocationError('unavailable');
      return;
    } else if (instruction.includes('Location detection timed out')) {
      handleLocationError('timeout');
      return;
    } else if (instruction.includes('too far') || instruction.includes('check your location') || instruction.includes('routing service issue')) {
      const errorMessage = navState.language === 'tamil' 
        ? instruction.includes('routing service issue') 
          ? 'வழிசெலுத்தல் சேவையில் சிக்கல் உள்ளது. நேரடி பாதையைப் பயன்படுத்துகிறேன்.'
          : 'உங்கள் இருப்பிடம் கல்லூரியிலிருந்து மிகவும் தொலைவில் உள்ளது. தயவுசெய்து உங்கள் இருப்பிடத்தை சரிபார்க்கவும் அல்லது அருகிலுள்ள இலக்கை தேர்ந்தெடுக்கவும்.'
        : instruction.includes('routing service issue')
          ? 'Routing service issue. Using direct route.'
          : 'Your location is too far from campus. Please check your location or select a nearby destination.';
      
      const response = addMessage('bot', errorMessage);
      speakMessage(response.content, 2); // High priority for error messages
      
      // Reset to home after speaking the error message (only for location errors, not routing issues)
      if (!instruction.includes('routing service issue')) {
        setTimeout(() => {
          resetToHome();
        }, 3000); // Wait 3 seconds after speaking
      }
    } else {
      // Check distance threshold for navigation instructions
      if (distance !== undefined && !speechManagerRef.current?.shouldSpeakNavigationInstruction(distance)) {
        // Distance is too far, don't speak but still add to chat
        console.log(`Distance ${distance}m exceeds threshold, not speaking instruction: ${instruction}`);
        addMessage('bot', instruction);
        return;
      }
      
      // Prevent repeated speech - only speak if different instruction and enough time has passed
      // But allow initial navigation messages to speak immediately
      const isInitialNavigation = instruction.includes('Navigation started') || instruction.includes('Total distance');
      const timeSinceLastSpeech = now - lastSpeechTime;
      const isDuplicateInstruction = instruction === lastSpokenInstruction;
      const shouldSpeak = isInitialNavigation || (!isDuplicateInstruction && timeSinceLastSpeech > 2000);
      
      if (shouldSpeak) {
        setLastSpokenInstruction(instruction);
        setLastSpeechTime(now);
        const response = addMessage('bot', instruction);
        console.log('Speaking instruction with priority:', isInitialNavigation ? 2 : 1, 'text:', instruction);
        speakMessage(response.content, isInitialNavigation ? 2 : 1); // Higher priority for initial messages
      } else {
        // Don't add duplicate instructions to chat either
        if (!isDuplicateInstruction) {
          console.log('Not speaking instruction (cooldown):', instruction);
          addMessage('bot', instruction);
        } else {
          console.log('Skipping duplicate instruction:', instruction);
        }
      }
    }
  };

  const resetToHome = () => {
    // Stop all current operations and clear speech queue
    speechManagerRef.current?.stopSpeaking();
    speechManagerRef.current?.clearQueue();
    speechManagerRef.current?.stopListening();
    
    // Clear any ongoing navigation state
    setCurrentInstruction('');
    setLastSpokenInstruction('');
    setLastSpeechTime(0);
    setIsRouteCalculating(false);
    setHasSpokenRouteCalculated(false);
    
    // Clear all states
    setIsProcessing(false);
    setNavState({
      currentStep: 'welcome',
      selectedDestination: null,
      isListening: false,
      isSpeaking: false,
      isMuted: navState.isMuted, // Preserve mute state
      language: navState.language,
      isARMode: false,
      cameraPermission: false
    });
    setShowMap(false);
    setNavigationMode('none');
    setIsMapFullscreen(false);
    setRouteInfo(null);
    setCurrentInstruction('');
    
    // Clear messages and add fresh welcome
    setMessages([]);
    
    // Add welcome message after a short delay
    setTimeout(() => {
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'bot',
        content: getTranslation('welcome', navState.language),
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      speakMessage(welcomeMessage.content);
    }, 500);
  };

  const resetNavigation = () => {
    // Immediately stop all speech and clear queue
    speechManagerRef.current?.stopSpeaking();
    speechManagerRef.current?.clearQueue();
    speechManagerRef.current?.stopListening();
    
    // Clear any ongoing navigation state
    setCurrentInstruction('');
    setLastSpokenInstruction('');
    setLastSpeechTime(0);
    setIsRouteCalculating(false);
    setHasSpokenRouteCalculated(false);
    
    setNavState(prev => ({
      currentStep: 'welcome',
      selectedDestination: null,
      isListening: false,
      isSpeaking: false,
      isMuted: navState.isMuted, // Preserve mute state
      language: navState.language,
      isARMode: false,
      cameraPermission: false
    }));
    setShowMap(false);
    setNavigationMode('none');
    setIsMapFullscreen(false);
    setRouteInfo(null);
    setCurrentInstruction('');
    
    // Add message and speak after a delay
    setTimeout(() => {
      const response = addMessage('bot', getTranslation('helpMore', navState.language));
      speakMessage(response.content);
    }, 500);
  };

  // New function to handle destination cancellation with better speech management
  const handleDestinationCancel = () => {
    // Immediately stop all speech and clear queue
    speechManagerRef.current?.stopSpeaking();
    speechManagerRef.current?.clearQueue();
    speechManagerRef.current?.stopListening();
    
    // Clear any ongoing navigation state
    setCurrentInstruction('');
    setLastSpokenInstruction('');
    setLastSpeechTime(0);
    setIsRouteCalculating(false);
    setHasSpokenRouteCalculated(false);
    
    // Add cancellation message
    const cancelMessage = navState.language === 'tamil' 
      ? 'வழிசெலுத்தல் ரத்து செய்யப்பட்டது. புதிய இலக்கைத் தேர்ந்தெடுக்கலாம்.'
      : 'Navigation cancelled. You can select a new destination.';
    
    const message = addMessage('bot', cancelMessage);
    
    // Show navigation status
    setNavigationStatus({
      isVisible: true,
      type: 'cancelled',
      message: navState.language === 'tamil' 
        ? 'வழிசெலுத்தல் ரத்து செய்யப்பட்டது'
        : 'Navigation Cancelled'
    });
    
    setNavState(prev => ({
      currentStep: 'welcome',
      selectedDestination: null,
      isListening: false,
      isSpeaking: false,
      isMuted: navState.isMuted,
      language: navState.language,
      isARMode: false,
      cameraPermission: false
    }));
    setShowMap(false);
    setNavigationMode('none');
    setIsMapFullscreen(false);
    setRouteInfo(null);
    setCurrentInstruction('');
    
    // Speak cancellation message after a short delay
    setTimeout(() => {
      speakMessage(message.content);
    }, 300);
    
    // Hide navigation status after 2 seconds
    setTimeout(() => {
      setNavigationStatus(null);
    }, 2000);
  };

  const handleBackToChat = () => {
    setIsMapFullscreen(false);
    setNavigationMode('none');
    setShowMapControls(false);
  };

  const toggleMapControls = () => {
    setShowMapControls(!showMapControls);
  };

  // Location error handling functions
  const handleLocationError = (errorType: LocationErrorType) => {
    setLocationError({ type: errorType, isOpen: true });
    
    // Add error message to chat
    const errorMessage = getLocationErrorMessage(errorType);
    const message = addMessage('bot', errorMessage);
    speakMessage(message.content, 2); // High priority for error messages
    
    // Show notification for non-critical errors
    if (errorType !== 'permission' && errorType !== 'unavailable') {
      showLocationNotification(errorMessage, 'warning');
    }
  };

  const getLocationErrorMessage = (errorType: LocationErrorType): string => {
    switch (errorType) {
      case 'permission':
        return navState.language === 'tamil' 
          ? 'இருப்பிட அனுமதி மறுக்கப்பட்டது. தயவுசெய்து உங்கள் உலாவி அமைப்புகளில் இருப்பிட அனுமதியை இயக்கவும்.'
          : 'Location permission denied. Please enable location access in your browser settings.';
      case 'unavailable':
        return navState.language === 'tamil'
          ? 'இருப்பிட சேவை கிடைக்கவில்லை. தயவுசெய்து உங்கள் சாதனத்தில் இருப்பிட சேவையை இயக்கவும்.'
          : 'Location service unavailable. Please enable location service on your device.';
      case 'timeout':
        return navState.language === 'tamil'
          ? 'இருப்பிட கண்டறிதல் நேரம் முடிந்தது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.'
          : 'Location detection timed out. Please try again.';
      case 'network':
        return navState.language === 'tamil'
          ? 'வலையமைப்பு சிக்கல். தயவுசெய்து உங்கள் இணைப்பை சரிபார்க்கவும்.'
          : 'Network issue. Please check your connection.';
      case 'too_far':
        return navState.language === 'tamil'
          ? 'உங்கள் இருப்பிடம் கல்லூரியிலிருந்து மிகவும் தொலைவில் உள்ளது. தயவுசெய்து அருகிலுள்ள இலக்கை தேர்ந்தெடுக்கவும்.'
          : 'Your location is too far from campus. Please select a nearby destination.';
      default:
        return navState.language === 'tamil'
          ? 'இருப்பிட சிக்கல் ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.'
          : 'Location error occurred. Please try again.';
    }
  };

  const handleRetryLocation = async () => {
    if (!locationServiceRef.current) return;
    
    setLocationError(null);
    
    try {
      const position = await locationServiceRef.current.getCurrentPosition();
      const newLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
      
      // Check if location is within campus bounds
      if (!locationServiceRef.current.isWithinCampusBounds(newLocation.lat, newLocation.lng)) {
        handleLocationError('too_far');
        return;
      }
      
      setUserLocation(newLocation);
      
      // Add success message
      const successMessage = navState.language === 'tamil' 
        ? 'இருப்பிடம் வெற்றிகரமாக கண்டறியப்பட்டது!'
        : 'Location detected successfully!';
      const message = addMessage('bot', successMessage);
      speakMessage(message.content);
      
      // Show success notification
      showLocationNotification(successMessage, 'success');
      
    } catch (error) {
      const locationError = error as any;
      handleLocationError(locationError.type || 'general');
    }
  };

  const handleManualLocation = () => {
    setLocationError(null);
    // Reset to home to allow user to select a different destination
    resetToHome();
  };

  const closeLocationError = () => {
    setLocationError(null);
  };

  const showLocationNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setLocationNotification({
      message,
      type,
      isVisible: true
    });
  };

  const closeLocationNotification = () => {
    setLocationNotification(null);
  };

  const handleCustomRouteSelect = (route: any) => {
    setSelectedCustomRoute(route.id);
    setShowCustomRoutes(false);
    
    // Add message about custom route
    const routeMessage = navState.language === 'tamil'
      ? `தனிப்பயன் வழி தேர்ந்தெடுக்கப்பட்டது: ${route.name}`
      : `Custom route selected: ${route.name}`;
    
    const message = addMessage('bot', routeMessage);
    speakMessage(message.content);
    
    // Show route details
    const detailsMessage = navState.language === 'tamil'
      ? `தூரம்: ${route.distance} மீட்டர், நேரம்: ${route.estimatedTime} நிமிடங்கள்`
      : `Distance: ${route.distance}m, Time: ${route.estimatedTime} minutes`;
    
    setTimeout(() => {
      const detailsMsg = addMessage('bot', detailsMessage);
      speakMessage(detailsMsg.content);
    }, 1000);
  };



  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative">
      {/* Top Right Controls */}
      <div className="fixed top-4 right-4 z-40 flex items-center space-x-2">
        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg bg-gradient-to-r from-gray-600 to-gray-700 text-white"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">{navState.language === 'tamil' ? 'அமைப்புகள்' : 'Settings'}</span>
        </button>
        
        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg ${
            navState.language === 'tamil' 
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
              : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>{navState.language === 'tamil' ? 'EN' : 'தமிழ்'}</span>
        </button>
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm border-b relative z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MapPin className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Campus Navigator</h1>
                <p className="text-sm text-gray-600">Your AI-powered campus guide</p>
              </div>
            </div>
            
            {routeInfo && (
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Navigation className="w-4 h-4" />
                  <span>{routeInfo.distance > 1000 
                    ? `${(routeInfo.distance / 1000).toFixed(1)}km` 
                    : `${Math.round(routeInfo.distance)}m`}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{routeInfo.duration > 60 
                    ? `${Math.round(routeInfo.duration / 60)}min` 
                    : `${Math.round(routeInfo.duration)}s`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Map Modal */}
      {isMapFullscreen && showMap && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Top Navigation Bar */}
          <div className="absolute top-0 left-0 right-0 z-20 bg-black bg-opacity-80 backdrop-blur-sm">
            <div className="flex items-center justify-between p-4">
              {/* Back Button */}
              <button
                onClick={handleBackToChat}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{navState.language === 'tamil' ? 'திரும்பு' : 'Back'}</span>
              </button>

              {/* Mode Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleNavigationMode}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    navigationMode === 'ar' 
                      ? 'bg-green-500 text-white' 
                      : navigationMode === 'split'
                      ? 'bg-purple-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {navigationMode === 'map' ? 'AR Mode' : 
                   navigationMode === 'ar' ? 'Split View' : 'Map Mode'}
                </button>
                
                {/* Map Controls Toggle */}
                <button
                  onClick={toggleMapControls}
                  className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsMapFullscreen(false)}
                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Map Controls Popup */}
          {showMapControls && (
            <div className="absolute top-20 right-4 z-30 bg-white rounded-lg shadow-xl p-4 min-w-48">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 text-sm">
                  {navState.language === 'tamil' ? 'வரைபட கட்டுப்பாடுகள்' : 'Map Controls'}
                </h3>
                
                <div className="space-y-2">
                  <button
                    onClick={() => setNavigationMode('map')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      navigationMode === 'map' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Map className="w-4 h-4" />
                      <span>{navState.language === 'tamil' ? 'வரைபட முறை' : 'Map Mode'}</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setNavigationMode('ar')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      navigationMode === 'ar' 
                        ? 'bg-green-100 text-green-700' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Camera className="w-4 h-4" />
                      <span>{navState.language === 'tamil' ? 'AR முறை' : 'AR Mode'}</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setNavigationMode('split')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      navigationMode === 'split' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Navigation className="w-4 h-4" />
                      <span>{navState.language === 'tamil' ? 'பிரிப்பு காட்சி' : 'Split View'}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Content */}
          <div className="flex-1 relative pt-16">
            {navigationMode === 'map' && (
              <NavigationMap
                selectedDestination={navState.selectedDestination}
                userLocation={userLocation}
                onLocationUpdate={setUserLocation}
                onRouteCalculated={handleRouteCalculated}
                onNavigationInstruction={handleNavigationInstruction}
              />
            )}
            
            {navigationMode === 'ar' && (
              <ARCamera
                isActive={true}
                onToggle={() => {}}
                currentInstruction={currentInstruction}
                currentDistance={currentDistance}
                language={navState.language}
                userLocation={userLocation}
                destinationName={navState.selectedDestination ? buildings[navState.selectedDestination]?.name : undefined}
                totalDistance={routeInfo?.distance}
                estimatedTime={routeInfo?.duration}
              />
            )}
            
            {navigationMode === 'split' && (
              <div className="h-full flex flex-col lg:flex-row">
                {/* AR Camera Section */}
                <div className="flex-1 relative">
                  <ARCamera
                    isActive={true}
                    onToggle={() => {}}
                    currentInstruction={currentInstruction}
                    currentDistance={currentDistance}
                    language={navState.language}
                    userLocation={userLocation}
                    destinationName={navState.selectedDestination ? buildings[navState.selectedDestination]?.name : undefined}
                    totalDistance={routeInfo?.distance}
                    estimatedTime={routeInfo?.duration}
                  />
                </div>
                
                {/* Map Section */}
                <div className="flex-1 border-t lg:border-t-0 lg:border-l border-gray-300">
                  <NavigationMap
                    selectedDestination={navState.selectedDestination}
                    userLocation={userLocation}
                    onLocationUpdate={setUserLocation}
                    onRouteCalculated={handleRouteCalculated}
                    onNavigationInstruction={handleNavigationInstruction}
                  />
                </div>
              </div>
            )}
            
            {/* Bot Character Overlay */}
            <div className="absolute top-20 left-4 z-10">
              <BotAnimation 
                isSpeaking={navState.isSpeaking}
                isListening={navState.isListening}
                isNavigating={true}
                size="small"
              />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 pb-24 relative z-20">
        <div className="grid gap-6 lg:grid-cols-1">
          {/* Chat Interface */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Bot Avatar Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="bg-white rounded-full p-4 shadow-2xl border-4 border-white/20">
                    <BotAnimation 
                      isSpeaking={navState.isSpeaking}
                      isListening={navState.isListening}
                      isNavigating={navState.currentStep === 'navigating'}
                      size="xlarge"
                    />
                  </div>
                  
                  {/* Status indicator ring */}
                  {(navState.isSpeaking || navState.isListening || navState.currentStep === 'navigating') && (
                    <div className="absolute inset-0 rounded-full border-4 border-white/40 animate-pulse"></div>
                  )}
                  
                  {/* Activity indicator */}
                  {navState.isSpeaking && (
                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-2 animate-bounce">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    </div>
                  )}
                  
                  {navState.isListening && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 animate-pulse">
                      <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                    </div>
                  )}
                </div>
              </div>
              <h2 className="text-xl font-semibold text-white">
                {navState.language === 'tamil' ? 'கல்லூரி வழிகாட்டி' : 'Campus Guide Assistant'}
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {navState.isListening ? getTranslation('listening', navState.language) : 
                 navState.isSpeaking ? getTranslation('speaking', navState.language) : 
                 speechManagerRef.current?.queueLength > 0 ? 
                   `${speechManagerRef.current.queueLength} message${speechManagerRef.current.queueLength > 1 ? 's' : ''} in queue` :
                 getTranslation('ready', navState.language)}
              </p>
            </div>

            {/* Chat Messages */}
            <div 
              ref={chatContainerRef}
              className="h-64 md:h-80 overflow-y-auto p-4 space-y-4 bg-gray-50"
            >
              {messages.map((message, idx) => (
                <ChatBubble key={message.id || `msg-${idx}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`} message={message} />
              ))}
            </div>

            {/* Controls */}
            <div className="p-4 bg-white border-t">
              <div className="flex items-center justify-center space-x-3 mb-4">
                {/* Map Toggle */}
                {navState.selectedDestination && (
                  <button
                    onClick={() => setIsMapFullscreen(true)}
                    disabled={isRouteCalculating}
                    className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg"
                  >
                    <Maximize2 className="w-4 h-4" />
                    <span>
                      {isRouteCalculating 
                        ? (navState.language === 'tamil' ? 'கணக்கிடுகிறது...' : 'Calculating...')
                        : (navState.language === 'tamil' ? 'வழிசெலுத்தல்' : 'Navigate')
                      }
                    </span>
                  </button>
                )}
              </div>

              {navState.selectedDestination && (
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={handleDestinationCancel}
                    className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-full text-xs md:text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    {getTranslation('newDestination', navState.language)}
                  </button>
                </div>
              )}
            </div>

            {/* Destination Selection */}
            {!navState.selectedDestination && (
              <div className="p-4 border-t bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">
                    {getTranslation('selectDestination', navState.language)}
                  </h3>
                  <button
                    onClick={() => setShowCustomRoutes(!showCustomRoutes)}
                    className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-full text-xs font-medium transition-all duration-300"
                  >
                    {showCustomRoutes 
                      ? (navState.language === 'tamil' ? 'வழக்கமான இடங்கள்' : 'Regular Places')
                      : (navState.language === 'tamil' ? 'தனிப்பயன் வழிகள்' : 'Custom Routes')
                    }
                  </button>
                </div>
                
                                {showCustomRoutes ? (
                  <div className="max-h-64 md:max-h-80 overflow-y-auto">
                    <CustomRoutesGrid
                      onSelectRoute={handleCustomRouteSelect}
                      selectedRouteId={selectedCustomRoute || undefined}
                      language={navState.language}
                    />
                  </div>
                ) : (
                  <div className="max-h-64 md:max-h-80 overflow-y-auto">
                    <DestinationGrid
                      onSelectDestination={handleDestinationSelect}
                      selectedDestination={navState.selectedDestination}
                      language={navState.language}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mini Map Preview - Only show when not in fullscreen */}
          {showMap && !isMapFullscreen && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mt-4">
              <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800 text-sm">
                  {navState.language === 'tamil' ? 'வரைபடம்' : 'Map Preview'}
                </h3>
                <button
                  onClick={() => setIsMapFullscreen(true)}
                  className="p-1 text-blue-600 hover:text-blue-800"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
              <div className="h-32">
                <NavigationMap
                  selectedDestination={navState.selectedDestination}
                  userLocation={userLocation}
                  onLocationUpdate={setUserLocation}
                  onRouteCalculated={handleRouteCalculated}
                  onNavigationInstruction={handleNavigationInstruction}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
              <SettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)}
          language={navState.language}
        />
        
        {/* Location Error Modal */}
        {locationError && (
          <LocationErrorModal
            isOpen={locationError.isOpen}
            onClose={closeLocationError}
            errorType={locationError.type}
            language={navState.language}
            onRetry={handleRetryLocation}
            onManualLocation={handleManualLocation}
          />
        )}
        
        {/* Location Notification */}
        {locationNotification && (
          <LocationNotification
            message={locationNotification.message}
            type={locationNotification.type}
            isVisible={locationNotification.isVisible}
            onClose={closeLocationNotification}
            autoHide={true}
            duration={5000}
          />
        )}
        
        {/* Navigation Status */}
        {navigationStatus && (
          <NavigationStatus
            isVisible={navigationStatus.isVisible}
            type={navigationStatus.type}
            message={navigationStatus.message}
            language={navState.language}
            onClose={() => setNavigationStatus(null)}
          />
        )}
        
        {/* Destination Image */}
        {showDestinationImage && navState.selectedDestination && (() => {
          const building = buildings[navState.selectedDestination];
          const customLocationsManager = CustomLocationsManager.getInstance();
          const customLocations = customLocationsManager.getCustomLocationsAsBuildings();
          const customLocation = customLocations[navState.selectedDestination];
          const destinationData = building || customLocation;
          
          if (destinationData?.image) {
            return (
              <DestinationImage
                imageUrl={destinationData.image}
                destinationName={destinationData.name}
                englishName={destinationData.englishName}
                description={destinationData.description}
                language={navState.language}
                onClose={() => setShowDestinationImage(false)}
              />
            );
          }
          return null;
        })()}

        {/* Fixed Bottom Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
          <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
            {/* Left: Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-full text-sm font-medium transition-all duration-300 shadow-lg hover:scale-105"
            >
              {navState.language === 'tamil' ? 'EN' : 'தமிழ்'}
            </button>

            {/* Center: Microphone Button */}
            <button
              onClick={startListening}
              disabled={navState.isListening || navState.isSpeaking || isProcessing || isRouteCalculating}
              className={`
                p-4 md:p-5 rounded-full transition-all duration-300 transform hover:scale-110 shadow-xl font-medium
                ${navState.isListening 
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {navState.isListening ? <MicOff className="w-6 h-6 md:w-7 md:h-7" /> : <Mic className="w-6 h-6 md:w-7 md:h-7" />}
            </button>

            {/* Right: Speaker/Mute Button */}
            <button
              onClick={toggleMute}
              className={`p-4 md:p-5 rounded-full transition-all duration-300 transform hover:scale-110 shadow-xl ${
                navState.isMuted 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' 
                  : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700'
              }`}
            >
              {navState.isMuted ? <VolumeX className="w-6 h-6 md:w-7 md:h-7" /> : <Volume2 className="w-6 h-6 md:w-7 md:h-7" />}
            </button>
          </div>
        </div>
      </div>
    );
  };