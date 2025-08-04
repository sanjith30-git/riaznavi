import React from 'react';

interface BotAnimationProps {
  isSpeaking?: boolean;
  isListening?: boolean;
  isNavigating?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
}

export const BotAnimation: React.FC<BotAnimationProps> = ({
  isSpeaking = false,
  isListening = false,
  isNavigating = false,
  className = '',
  size = 'medium'
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-16 h-16 md:w-20 md:h-20';
      case 'medium':
        return 'w-24 h-24 md:w-32 md:h-32';
      case 'large':
        return 'w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48';
      case 'xlarge':
        return 'w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56';
      default:
        return 'w-24 h-24 md:w-32 md:h-32';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* White background container */}
      <div className="bg-white rounded-full shadow-lg p-2 border-2 border-blue-200 hover:border-blue-300 transition-colors">
        {/* Video container */}
        <div className={`relative ${getSizeClasses()} overflow-hidden rounded-full`}>
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{
              filter: isListening ? 'brightness(1.2) saturate(1.3)' : 
                      isSpeaking ? 'brightness(1.1) saturate(1.2)' : 
                      'brightness(1) saturate(1)'
            }}
            onError={(e) => {
              console.error('Video loading error:', e);
            }}
            onLoadStart={() => {
              console.log('Video loading started');
            }}
            onCanPlay={() => {
              console.log('Video can play');
            }}
          >
            <source src="/BotAnimation/Bot.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {/* Status indicator overlay */}
          {isListening && (
            <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-full animate-pulse" />
          )}
          
          {isSpeaking && (
            <div className="absolute inset-0 bg-green-500 bg-opacity-20 rounded-full animate-pulse" />
          )}
          
          {isNavigating && (
            <div className="absolute inset-0 bg-purple-500 bg-opacity-20 rounded-full animate-pulse" />
          )}
        </div>
      </div>
      
      {/* Status text */}
      {(isListening || isSpeaking || isNavigating) && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
            {isListening && '🎤 Listening...'}
            {isSpeaking && '🗣️ Speaking...'}
            {isNavigating && '🧭 Navigating...'}
          </div>
        </div>
      )}
    </div>
  );
}; 