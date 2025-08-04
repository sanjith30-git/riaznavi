import React from 'react';

interface Avatar3DProps {
  isSpeaking: boolean;
  isListening: boolean;
  isNavigating: boolean;
  language: 'tamil' | 'english';
  className?: string;
}

export const Avatar3D: React.FC<Avatar3DProps> = ({ 
  isSpeaking, 
  isListening, 
  isNavigating,
  language,
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className={`
        relative w-20 h-20 md:w-32 md:h-32 transition-all duration-500 transform
        ${isSpeaking ? 'scale-110' : ''}
        ${isListening ? 'ring-4 ring-green-400 ring-opacity-75' : ''}
        ${isNavigating ? 'ring-4 ring-blue-400 ring-opacity-75' : ''}
      `}>
        {/* Placeholder for user's custom character - they can replace this div */}
        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
          <div className="w-16 h-16 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center">
            <span className="text-lg md:text-2xl">🤖</span>
          </div>
        </div>
        
        {/* Status indicators */}
        {isSpeaking && (
          <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-4 h-4 md:w-6 md:h-6 bg-blue-500 rounded-full animate-pulse">
            <div className="w-full h-full bg-blue-400 rounded-full animate-ping"></div>
          </div>
        )}
        
        {isListening && (
          <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-4 h-4 md:w-6 md:h-6 bg-green-500 rounded-full animate-pulse">
            <div className="w-full h-full bg-green-400 rounded-full animate-ping"></div>
          </div>
        )}
        
        {/* Language indicator */}
        <div className="absolute -bottom-1 md:-bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="bg-white rounded-full px-1 md:px-2 py-0.5 md:py-1 text-xs font-semibold text-gray-600 shadow-md">
            {language === 'tamil' ? 'தமிழ்' : 'EN'}
          </div>
        </div>
      </div>
    </div>
  );
};