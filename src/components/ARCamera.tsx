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
              <div className="mt-2 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm text-center animate-pulse">
                {language === 'tamil' ? 'என்னைப் பின்தொடர்!' : 'Follow me!'}
              </div>
            </div>
            
            {/* Google Maps-style Street Name Banner */}
            <div className="absolute top-20 left-0 right-0 px-4 flex justify-center">
              <div className="bg-white shadow-lg rounded-full px-6 py-2 flex items-center space-x-2 max-w-xs">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-800 truncate">
                  {destinationName || (language === 'tamil' ? 'இலக்கு' : 'Destination')}
                </span>
              </div>
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
            
            {/* Compass Arrow */}
            {compassHeading !== null && (
              <div className="absolute bottom-20 right-4 bg-white shadow-lg rounded-full p-2">
                <CompassArrow 
                  compassHeading={compassHeading} 
                  size="medium" 
                  color="text-blue-600" 
                  showLabel={true}
                  language={language}
                />
              </div>
            )}
            
            {/* Speed Limit Indicator (Google Maps style) */}
             <div className="absolute top-20 left-20 flex flex-col items-center space-y-2 pointer-events-auto">
               {/* Current Speed */}
               <div className="bg-white rounded-lg shadow-lg p-2 flex flex-col items-center">
                 <span className="text-lg font-bold">{currentSpeed}</span>
                 <span className="text-xs text-gray-500">{language === 'tamil' ? 'கி.மீ/மணி' : 'km/h'}</span>
               </div>
               
               {/* Speed Limit */}
               <div className="bg-white rounded-full shadow-lg p-1 w-12 h-12 flex items-center justify-center border-2 border-red-500">
                 <span className="text-lg font-bold">{speedLimit}</span>
               </div>
             </div>
             
             {/* Traffic Alert (Google Maps style) */}
             {showTrafficAlert && (
               <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-4 max-w-xs w-full animate-bounce-slow pointer-events-auto">
                 <div className="flex items-start">
                   <div className="mr-3 flex-shrink-0">
                     {trafficAlertType === 'accident' && (
                       <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                         <AlertTriangle className="w-6 h-6 text-red-600" />
                       </div>
                     )}
                     {trafficAlertType === 'construction' && (
                       <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                         <Construction className="w-6 h-6 text-orange-600" />
                       </div>
                     )}
                     {trafficAlertType === 'police' && (
                       <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                         <Shield className="w-6 h-6 text-blue-600" />
                       </div>
                     )}
                   </div>
                   <div className="flex-1">
                     <h3 className="font-bold text-gray-900">
                       {trafficAlertType === 'accident' && (language === 'tamil' ? 'விபத்து முன்னே' : 'Accident Ahead')}
                       {trafficAlertType === 'construction' && (language === 'tamil' ? 'கட்டுமானப் பணி' : 'Construction Zone')}
                       {trafficAlertType === 'police' && (language === 'tamil' ? 'காவல்துறை சோதனை' : 'Police Checkpoint')}
                     </h3>
                     <p className="text-sm text-gray-600 mt-1">
                       {trafficAlertType === 'accident' && (language === 'tamil' ? '500 மீட்டர் தொலைவில்' : '500 meters ahead')}
                       {trafficAlertType === 'construction' && (language === 'tamil' ? '300 மீட்டர் தொலைவில்' : '300 meters ahead')}
                       {trafficAlertType === 'police' && (language === 'tamil' ? '200 மீட்டர் தொலைவில்' : '200 meters ahead')}
                     </p>
                   </div>
                   <button className="ml-2 text-gray-400 hover:text-gray-600" onClick={() => setShowTrafficAlert(false)}>
                     <X className="w-5 h-5" />
                   </button>
                 </div>
               </div>
             )}
            
            {/* Mini Map Toggle Button */}
            <div className="absolute top-20 left-4 bg-white shadow-lg rounded-full p-2 cursor-pointer pointer-events-auto"
                 onClick={() => setShowMiniMap(!showMiniMap)}>
              <Map className={`w-6 h-6 ${showMiniMap ? 'text-blue-600' : 'text-gray-700'}`} />
            </div>
            
            {/* Street View Toggle Button */}
             <div 
               className={`absolute top-36 left-4 ${streetViewMode ? 'bg-blue-500' : 'bg-white'} shadow-lg rounded-full p-2 cursor-pointer pointer-events-auto`}
               onClick={() => setStreetViewMode(!streetViewMode)}
             >
               <MapPin className={`w-6 h-6 ${streetViewMode ? 'text-white' : 'text-gray-700'}`} />
             </div>
             
             {/* Voice Guidance Indicator */}
             {voiceGuidanceEnabled && (
               <div 
                 className={`absolute top-52 left-4 ${isVoiceSpeaking ? 'bg-blue-500' : 'bg-white'} shadow-lg rounded-full p-2 cursor-pointer pointer-events-auto`}
                 onClick={() => setVoiceGuidanceEnabled(!voiceGuidanceEnabled)}
               >
                 {isVoiceSpeaking ? (
                   <Volume2 className="w-6 h-6 text-white" />
                 ) : (
                   <Volume2 className="w-6 h-6 text-gray-700" />
                 )}
                 
                 {/* Voice wave animation when speaking */}
                 {isVoiceSpeaking && (
                   <div className="absolute -right-1 -top-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                     <div className="absolute w-6 h-6 bg-blue-400 rounded-full opacity-75 animate-ping"></div>
                   </div>
                 )}
                 
                 {/* Voice guidance speech bubble */}
                 {isVoiceSpeaking && currentInstruction && (
                   <div className="absolute left-12 top-0 w-48 bg-blue-500 text-white p-3 rounded-lg shadow-lg">
                     <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-90">
                       <div className="w-3 h-3 bg-blue-500 transform rotate-45"></div>
                     </div>
                     <p className="text-sm">
                       {currentInstruction}
                     </p>
                     {currentDistance && (
                       <p className="text-xs mt-1 opacity-90">
                         {formatDistance(currentDistance, language)}
                       </p>
                     )}
                   </div>
                 )}
               </div>
             )}
            
            {/* Street View Overlay */}
            {streetViewMode && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-10">
                <div className="text-white text-center mb-4">
                  <MapPin className="w-12 h-12 mx-auto mb-2" />
                  <h2 className="text-xl font-bold">
                    {language === 'tamil' ? 'தெரு பார்வை' : 'Street View'}
                  </h2>
                  <p className="text-sm opacity-80 mt-1">
                    {language === 'tamil' ? 'தெரு பார்வைக்கு மாறுகிறது...' : 'Switching to Street View...'}
                  </p>
                </div>
                <div className="w-16 h-16 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            {/* Mini Map (Google Maps style) */}
             {showMiniMap && (
               <div className="absolute bottom-32 right-4 w-32 h-32 bg-white rounded-lg shadow-lg overflow-hidden pointer-events-auto">
                 <div className={`relative w-full h-full ${show3DView ? 'bg-blue-100' : 'bg-blue-50'}`}>
                   {/* Simulated map - in a real implementation, this would be an actual map */}
                   <div className="absolute inset-0 flex items-center justify-center">
                     {/* 2D or 3D map view based on setting */}
                     {show3DView ? (
                       // 3D perspective view (simulated)
                       <div className="relative w-full h-full">
                         {/* Sky */}
                         <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-blue-300 to-blue-100" />
                         
                         {/* Ground */}
                         <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gray-200">
                           {/* Perspective grid lines */}
                           <div className="absolute inset-0">
                             <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-400" />
                             <div className="absolute bottom-1/4 left-0 right-0 h-px bg-gray-400 transform scale-x-75" />
                             <div className="absolute bottom-2/4 left-0 right-0 h-px bg-gray-400 transform scale-x-50" />
                             <div className="absolute bottom-3/4 left-0 right-0 h-px bg-gray-400 transform scale-x-25" />
                             
                             <div className="absolute bottom-0 top-0 left-1/4 w-px bg-gray-400" />
                             <div className="absolute bottom-0 top-0 right-1/4 w-px bg-gray-400" />
                             <div className="absolute bottom-0 top-0 left-1/2 w-px bg-gray-400" />
                           </div>
                           
                           {/* Route line (perspective) */}
                           <div className="absolute bottom-0 left-1/2 w-2 h-2/3 bg-blue-500 transform -translate-x-1/2 skew-y-12" />
                           
                           {/* User position */}
                           <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                             <div className="w-3 h-3 bg-blue-600 rounded-full" />
                           </div>
                           
                           {/* Destination marker */}
                           <div className="absolute bottom-1/2 left-1/2 transform -translate-x-1/2">
                             <div className="w-4 h-6 bg-red-600 transform -translate-x-1/2" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
                           </div>
                         </div>
                       </div>
                     ) : (
                       // Standard 2D view
                       <>
                         <div className="w-full h-full bg-gray-200 opacity-50" />
                         <div className="absolute w-full h-0.5 bg-blue-500 top-1/2 transform -translate-y-1/2" />
                         <div className="absolute h-full w-0.5 bg-blue-500 left-1/2 transform -translate-x-1/2" />
                         <div className="absolute w-3 h-3 bg-blue-600 rounded-full transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2" />
                         {/* Destination marker */}
                         <div className="absolute w-3 h-3 bg-red-600 rounded-full transform translate-x-3 -translate-y-3 left-1/2 top-1/2" />
                       </>
                     )}
                   </div>
                   
                   {/* Map type indicator */}
                   <div className="absolute left-2 top-2 bg-white rounded-sm shadow-sm px-1 py-0.5 text-xs font-medium">
                     {show3DView ? '3D' : '2D'}
                   </div>
                   
                   {/* Zoom controls */}
                   <div className="absolute right-2 bottom-2 flex flex-col bg-white rounded-md shadow">
                     <button className="p-1 text-gray-700 hover:bg-gray-100 rounded-t-md">+</button>
                     <div className="w-full h-px bg-gray-200" />
                     <button className="p-1 text-gray-700 hover:bg-gray-100 rounded-b-md">-</button>
                   </div>
                 </div>
               </div>
             )}
            
            {/* ETA and Distance Banner (Google Maps style) */}
            {showEta && (
              <div className="absolute top-32 left-0 right-0 px-4 flex justify-center">
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                  <div className="flex flex-col">
                    <div className="flex divide-x divide-gray-200">
                      <div className="px-4 py-2 flex flex-col items-center">
                        <span className="text-xs text-gray-500">{language === 'tamil' ? 'நேரம்' : 'ETA'}</span>
                        <span className="font-bold text-gray-800">{formatTime(estimatedTime)}</span>
                      </div>
                      <div className="px-4 py-2 flex flex-col items-center">
                        <span className="text-xs text-gray-500">{language === 'tamil' ? 'மொத்த தூரம்' : 'Total'}</span>
                        <span className="font-bold text-gray-800">{formatDistance(totalDistance)}</span>
                      </div>
                    </div>
                    {/* Route progress bar (Google Maps style) */}
                    <div className="w-full px-4 pb-2">
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        {/* Simulated progress - in a real implementation, this would be calculated based on actual progress */}
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '35%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Instruction Overlay (Google Maps style) */}
            <div className="absolute bottom-20 left-0 right-0 px-4">
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                {/* Street name banner */}
                <div className="bg-gray-100 px-3 py-1 border-b border-gray-200">
                  <p className="text-xs font-medium text-gray-600">
                    {language === 'tamil' ? 'தற்போதைய சாலை' : 'Current Street'}
                  </p>
                </div>
                
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
                
                {/* Lane guidance (Google Maps style) */}
                {(currentInstruction?.includes('right') || currentInstruction?.includes('left')) && (
                  <div className="px-4 pb-3 pt-0">
                    <p className="text-xs text-gray-500 mb-2">
                      {language === 'tamil' ? 'பரிந்துரைக்கப்பட்ட தடம்' : 'Recommended Lane'}
                    </p>
                    <div className="flex justify-center space-x-1">
                      {/* Lane indicators - in a real implementation, these would be dynamically generated based on the intersection */}
                      {currentInstruction?.includes('left') ? (
                        <>
                          <div className="w-8 h-12 bg-blue-500 rounded-sm flex items-end justify-center pb-1">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M10 19L3 12L10 5V19Z" fill="white" />
                            </svg>
                          </div>
                          <div className="w-8 h-12 bg-gray-200 rounded-sm flex items-end justify-center pb-1">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 5L12 19" stroke="#666" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </div>
                          <div className="w-8 h-12 bg-gray-200 rounded-sm flex items-end justify-center pb-1">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M14 5L21 12L14 19V5Z" fill="#666" />
                            </svg>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-12 bg-gray-200 rounded-sm flex items-end justify-center pb-1">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M10 19L3 12L10 5V19Z" fill="#666" />
                            </svg>
                          </div>
                          <div className="w-8 h-12 bg-gray-200 rounded-sm flex items-end justify-center pb-1">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 5L12 19" stroke="#666" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </div>
                          <div className="w-8 h-12 bg-blue-500 rounded-sm flex items-end justify-center pb-1">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M14 5L21 12L14 19V5Z" fill="white" />
                            </svg>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Next instruction preview (if available) */}
                <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 flex items-center">
                  <div className="mr-2 flex-shrink-0">
                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xs text-gray-600">2</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">
                    {language === 'tamil' ? 'அடுத்த வழிமுறை காத்திருக்கிறது' : 'Next instruction pending'}
                  </p>
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
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 text-sm">
                  {language === 'tamil' ? 'AR கட்டுப்பாடுகள்' : 'AR Controls'}
                </h3>
                
                <div className="space-y-2">
                  <button
                    onClick={() => setShowControls(false)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-2">
                      <Camera className="w-4 h-4" />
                      <span>{language === 'tamil' ? 'கேமரா மாற்று' : 'Switch Camera'}</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setShowMiniMap(!showMiniMap)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-2">
                      <Map className="w-4 h-4" />
                      <span>
                        {language === 'tamil' 
                          ? (showMiniMap ? 'மினி வரைபடத்தை மறை' : 'மினி வரைபடத்தைக் காட்டு')
                          : (showMiniMap ? 'Hide Mini Map' : 'Show Mini Map')
                        }
                      </span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setShowEta(!showEta)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-2">
                      <LocateFixed className="w-4 h-4" />
                      <span>
                        {language === 'tamil' 
                          ? (showEta ? 'ETA மறை' : 'ETA காட்டு')
                          : (showEta ? 'Hide ETA' : 'Show ETA')
                        }
                      </span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setShowControls(false)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-2">
                      <Navigation className="w-4 h-4" />
                      <span>{language === 'tamil' ? 'வழிகாட்டுதல் முறை' : 'Navigation Mode'}</span>
                    </div>
                  </button>
                  
                  <div className="pt-2 border-t border-gray-200">
                    <h4 className="text-xs text-gray-500 mb-2">
                      {language === 'tamil' ? 'வரைபட அமைப்புகள்' : 'Map Settings'}
                    </h4>
                    
                    <div className="flex items-center justify-between text-sm">
                        <span>{language === 'tamil' ? '3D காட்சி' : '3D View'}</span>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                          <input 
                            type="checkbox" 
                            id="toggle-3d" 
                            className="sr-only" 
                            checked={show3DView}
                            onChange={() => setShow3DView(!show3DView)}
                          />
                          <div className={`block h-6 ${show3DView ? 'bg-blue-200' : 'bg-gray-300'} rounded-full w-10`}></div>
                          <div className={`dot absolute top-1 bg-white w-4 h-4 rounded-full transition-all duration-200 transform ${show3DView ? 'translate-x-5 bg-blue-600' : 'left-1'}`}></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span>{language === 'tamil' ? 'குரல் வழிகாட்டல்' : 'Voice Guidance'}</span>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                          <input 
                            type="checkbox" 
                            id="toggle-voice" 
                            className="sr-only" 
                            checked={voiceGuidanceEnabled}
                            onChange={() => setVoiceGuidanceEnabled(!voiceGuidanceEnabled)}
                          />
                          <div className={`block h-6 ${voiceGuidanceEnabled ? 'bg-blue-200' : 'bg-gray-300'} rounded-full w-10`}></div>
                          <div className={`dot absolute top-1 bg-white w-4 h-4 rounded-full transition-all duration-200 transform ${voiceGuidanceEnabled ? 'translate-x-5 bg-blue-600' : 'left-1'}`}></div>
                        </div>
                      </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};