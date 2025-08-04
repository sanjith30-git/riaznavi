import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, CornerUpLeft, CornerUpRight, CornerDownLeft, CornerDownRight } from 'lucide-react';

interface DirectionalArrowProps {
  direction: 'left' | 'right' | 'straight' | 'back' | 'slight-left' | 'slight-right' | 'sharp-left' | 'sharp-right' | 'arrive';
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  animate?: boolean;
  color?: string;
  distance?: number;
  language?: 'tamil' | 'english';
}

export const DirectionalArrow: React.FC<DirectionalArrowProps> = ({
  direction,
  size = 'large',
  animate = true,
  color = 'text-yellow-400',
  distance,
  language = 'english'
}) => {
  // Determine size class based on prop
  const sizeClass = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
    xlarge: 'w-24 h-24'
  }[size];

  // Determine animation class
  const animationClass = animate ? 'animate-pulse' : '';

  // Determine which arrow to display based on direction
  const getArrowComponent = () => {
    switch (direction) {
      case 'left':
        return <ArrowLeft className={`${sizeClass} ${color} ${animationClass} drop-shadow-lg`} />;
      case 'right':
        return <ArrowRight className={`${sizeClass} ${color} ${animationClass} drop-shadow-lg`} />;
      case 'straight':
        return <ArrowUp className={`${sizeClass} ${color} ${animationClass} drop-shadow-lg`} />;
      case 'back':
        return <ArrowDown className={`${sizeClass} ${color} ${animationClass} drop-shadow-lg`} />;
      case 'slight-left':
        return <CornerUpLeft className={`${sizeClass} ${color} ${animationClass} drop-shadow-lg`} />;
      case 'slight-right':
        return <CornerUpRight className={`${sizeClass} ${color} ${animationClass} drop-shadow-lg`} />;
      case 'sharp-left':
        return <CornerDownLeft className={`${sizeClass} ${color} ${animationClass} drop-shadow-lg`} />;
      case 'sharp-right':
        return <CornerDownRight className={`${sizeClass} ${color} ${animationClass} drop-shadow-lg`} />;
      case 'arrive':
        return (
          <div className={`flex flex-col items-center ${animationClass}`}>
            <div className={`${color} ${sizeClass} flex items-center justify-center rounded-full border-4 border-current`}>
              <span className="text-current font-bold text-lg">✓</span>
            </div>
          </div>
        );
      default:
        return <ArrowUp className={`${sizeClass} ${color} ${animationClass} drop-shadow-lg`} />;
    }
  };

  // Format distance text
  const getDistanceText = () => {
    if (distance === undefined) return null;
    
    if (distance >= 1000) {
      const km = (distance / 1000).toFixed(1);
      return language === 'tamil' ? `${km} கி.மீ` : `${km} km`;
    } else {
      const m = Math.round(distance);
      return language === 'tamil' ? `${m} மீ` : `${m} m`;
    }
  };

  return (
    <div className="flex flex-col items-center">
      {getArrowComponent()}
      {distance !== undefined && (
        <div className={`mt-2 font-bold ${color} text-center drop-shadow-lg`}>
          {getDistanceText()}
        </div>
      )}
    </div>
  );
};