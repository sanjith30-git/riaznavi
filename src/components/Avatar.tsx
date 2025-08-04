import React from 'react';
import { User, MessageCircle } from 'lucide-react';

interface AvatarProps {
  isSpeaking: boolean;
  isListening: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ isSpeaking, isListening, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Main avatar container */}
      <div className={`
        relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 
        flex items-center justify-center shadow-2xl transition-all duration-300
        ${isSpeaking ? 'animate-pulse scale-110' : ''}
        ${isListening ? 'ring-4 ring-green-400 ring-opacity-75' : ''}
      `}>
        {/* Avatar face */}
        <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center">
          <User className="w-16 h-16 text-blue-600" />
        </div>
        
        {/* Speech indicator */}
        {isSpeaking && (
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-bounce">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
        )}
        
        {/* Listening indicator */}
        {isListening && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-ping"></div>
        )}
      </div>
      
      {/* Audio waves animation when speaking */}
      {isSpeaking && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-1 bg-white rounded-full animate-pulse`}
                style={{
                  height: `${Math.random() * 20 + 10}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.5s'
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};