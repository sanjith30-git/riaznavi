import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, Navigation, X, Settings, ArrowLeft, Map, Compass, MapPin, LocateFixed, AlertTriangle, Construction, Shield, Volume2, VolumeX } from 'lucide-react';
import { DirectionalArrow } from './DirectionalArrow';
import { CompassArrow } from './CompassArrow';

interface ARCameraProps {
  isActive: boolean;
  onToggle: () => void;
  currentInstruction: string;
  language: 'tamil' | 'english';
  currentDistance?: number;
  userLocation?: { lat: number; lng: number } | null;
  destinationName?: string;
  totalDistance?: number;
  estimatedTime?: number;
}

export const ARCamera: React.FC<ARCameraProps> = ({ 
  isActive, 
  onToggle, 
  currentInstruction,
  language,
  currentDistance,
  userLocation,
  destinationName,
  totalDistance,
  estimatedTime
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [showControls, setShowControls] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [compassHeading, setCompassHeading] = useState<number | null>(null);
  const [showEta, setShowEta] = useState(true);
  const [show3DView, setShow3DView] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0); // km/h
  const [speedLimit, setSpeedLimit] = useState(50); // km/h
  const [showTrafficAlert, setShowTrafficAlert] = useState(false);
  const [trafficAlertType, setTrafficAlertType] = useState<'accident' | 'construction' | 'police'>('construction');
  const [streetViewMode, setStreetViewMode] = useState(false); // Google Maps-style street view toggle
  const [voiceGuidanceEnabled, setVoiceGuidanceEnabled] = useState(true); // Google Maps-style voice guidance toggle
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false); // Track when voice guidance is actively speaking

  useEffect(() => {
    if (isActive) {
      startCamera();
      startCompass();
    } else {
      stopCamera();
      stopCompass();
    }

    return () => {
      stopCamera();
      stopCompass();
    };
  }, [isActive]);
  
  // Simulate speed changes for demonstration purposes
  useEffect(() => {
    // In a real implementation, this would use the device's GPS to get actual speed
    const speedInterval = setInterval(() => {
      // Generate a random speed between 0 and 60 km/h
      const randomSpeed = Math.floor(Math.random() * 60);
      setCurrentSpeed(randomSpeed);
    }, 3000); // Update every 3 seconds
    
    return () => {
      clearInterval(speedInterval);
    };
  }, []);
  
  // Simulate traffic alerts for demonstration purposes
  useEffect(() => {
    // Show a traffic alert after 5 seconds
    const showAlertTimeout = setTimeout(() => {
      setShowTrafficAlert(true);
      
      // Randomly select an alert type
      const alertTypes: Array<'accident' | 'construction' | 'police'> = ['accident', 'construction', 'police'];
      const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      setTrafficAlertType(randomType);
      
      // Hide the alert after 10 seconds
      const hideAlertTimeout = setTimeout(() => {
        setShowTrafficAlert(false);
      }, 10000);
      
      return () => clearTimeout(hideAlertTimeout);
    }, 5000);
    
    return () => clearTimeout(showAlertTimeout);
  }, []);
  
  // Simulate voice guidance speaking for demonstration purposes
  useEffect(() => {
    if (!voiceGuidanceEnabled) {
      setIsVoiceSpeaking(false);
      return;
    }
    
    // Simulate voice speaking every 15 seconds if voice guidance is enabled
    const voiceInterval = setInterval(() => {
      // Start speaking
      setIsVoiceSpeaking(true);
      
      // Stop speaking after 3 seconds
      setTimeout(() => {
        setIsVoiceSpeaking(false);
      }, 3000);
    }, 15000);
    
    // Initial voice guidance when component mounts
    if (currentInstruction) {
      setIsVoiceSpeaking(true);
      setTimeout(() => {
        setIsVoiceSpeaking(false);
      }, 3000);
    }
    
    return () => clearInterval(voiceInterval);
  }, [voiceGuidanceEnabled, currentInstruction]);
  
  // CSS for animations
  useEffect(() => {
    // Add CSS for bounce animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes bounce-slow {
        0%, 100% {
          transform: translateY(-50%) translateX(-50%);
        }
        50% {
          transform: translateY(-60%) translateX(-50%);
        }
      }
      
      .animate-bounce-slow {
        animation: bounce-slow 2s infinite ease-in-out;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Handle device orientation for compass
  const startCompass = () => {
    if ('DeviceOrientationEvent' in window) {
      const handleOrientation = (event: DeviceOrientationEvent) => {
        // Alpha is the compass direction (rotation around z-axis)
        if (event.alpha !== null) {
          setCompassHeading(event.alpha);
        }
      };
      
      window.addEventListener('deviceorientation', handleOrientation);
      return () => window.removeEventListener('deviceorientation', handleOrientation);
    }
  };
  
  const stopCompass = () => {
    // Cleanup function is handled in the useEffect return
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError('');
    } catch (err) {
      setError(language === 'tamil' 
        ? 'கேமரா அணுகல் பிழை. தயவுசெய்து அனுமதிகளை சரிபார்க்கவும்.'
        : 'Camera access error. Please check permissions.'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Format time for display
  const formatTime = (seconds?: number): string => {
    if (!seconds) return '--';
    
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return language === 'tamil'
        ? `${hours} மணி ${minutes % 60} நிமி`
        : `${hours}h ${minutes % 60}m`;
    } else {
      return language === 'tamil'
        ? `${minutes} நிமிடங்கள்`
        : `${minutes} min`;
    }
  };
  
  // Format distance for display
  const formatDistance = (meters?: number): string => {
    if (!meters) return '--';
    
    if (meters >= 1000) {
      const km = (meters / 1000).toFixed(1);
      return language === 'tamil' ? `${km} கி.மீ` : `${km} km`;
    } else {
      const m = Math.round(meters);
      return language === 'tamil' ? `${m} மீ` : `${m} m`;
    }
  };
  
  // Function to determine direction from instruction text
  const getDirectionFromInstruction = (instruction: string): 'left' | 'right' | 'straight' | 'back' | 'slight-left' | 'slight-right' | 'sharp-left' | 'sharp-right' | 'arrive' => {
    const lowerInstruction = instruction.toLowerCase();
    
    if (lowerInstruction.includes('arrived') || lowerInstruction.includes('destination')) {
      return 'arrive';
    } else if (lowerInstruction.includes('turn left') || lowerInstruction.includes('turn to the left')) {
      return 'left';
    } else if (lowerInstruction.includes('turn right') || lowerInstruction.includes('turn to the right')) {
      return 'right';
    } else if (lowerInstruction.includes('slight left') || lowerInstruction.includes('bear left')) {
      return 'slight-left';
    } else if (lowerInstruction.includes('slight right') || lowerInstruction.includes('bear right')) {
      return 'slight-right';
    } else if (lowerInstruction.includes('sharp left')) {
      return 'sharp-left';
    } else if (lowerInstruction.includes('sharp right')) {
      return 'sharp-right';
    } else if (lowerInstruction.includes('u-turn') || lowerInstruction.includes('turn around')) {
      return 'back';
    } else if (lowerInstruction.includes('continue') || lowerInstruction.includes('straight') || lowerInstruction.includes('forward')) {
      return 'straight';
    } else {
      // Default to straight if no direction is detected
      return 'straight';
    }
  };

  if (!isActive) {
    return (
      <div className="flex items-center justify-center p-4">
        <button
          onClick={onToggle}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
        >
          <Camera className="w-5 h-5" />
          <span>{language === 'tamil' ? 'AR வழிசெலுத்தல்' : 'AR Navigation'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      {error ? (
        <div className="flex items-center justify-center h-full text-white p-4">
          <div className="text-center">
            <CameraOff className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <p className="text-sm">{error}</p>
            <button
              onClick={onToggle}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              {language === 'tamil' ? 'மூடு' : 'Close'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {/* AR Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Direction Arrow based on instruction */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <DirectionalArrow 
                direction={getDirectionFromInstruction(currentInstruction)} 
                size="xlarge" 
                animate={true} 
                color="text-yellow-400" 
                distance={currentDistance}
                language={language}
                compassHeading={compassHeading}
              />
            </div>
            
            {/* Compass Indicator */}
            {compassHeading !== null && (
              <div className="absolute top-20 right-4 bg-white shadow-lg rounded-full p-2">
                <div 
                  className="relative w-8 h-8 flex items-center justify-center"
                  style={{ transform: `rotate(${compassHeading}deg)` }}
                >
                  <Compass className="w-6 h-6 text-gray-700" />
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-1 h-2 bg-red-500 rounded-full" />
                </div>
              </div>
            )}
            
            {/* Instruction Overlay (Google Maps style) */}
            <div className="absolute bottom-20 left-0 right-0 px-4">
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                {/* Main instruction */}
                <div className="p-4 flex items-center space-x-4">
                  <div className="bg-blue-100 rounded-full p-3">
                    <DirectionalArrow 
                      direction={getDirectionFromInstruction(currentInstruction)} 
                      size="small" 
                      animate={false} 
                      color="text-blue-600" 
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-800">{currentInstruction}</p>
                    {currentDistance !== undefined && (
                      <p className="text-sm text-gray-600">{formatDistance(currentDistance)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Top Controls Bar */}
          <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={onToggle}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">{language === 'tamil' ? 'திரும்பு' : 'Back'}</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowControls(!showControls)}
                  className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                >
                  <Settings className="w-4 h-4" />
                </button>
                
                <button
                  onClick={onToggle}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* AR Controls Popup (Google Maps style) */}
          {showControls && (
            <div className="absolute top-20 right-4 z-30 bg-white rounded-lg shadow-xl p-4 min-w-48">
              <p className="text-sm text-gray-600">{language === 'tamil' ? 'AR அமைப்புகள்' : 'AR Settings'}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};