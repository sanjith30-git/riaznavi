import React from 'react';
import { ArrowUp } from 'lucide-react';

interface CompassArrowProps {
  compassHeading: number | null;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  color?: string;
  showLabel?: boolean;
  language?: 'tamil' | 'english';
}

export const CompassArrow: React.FC<CompassArrowProps> = ({
  compassHeading,
  size = 'medium',
  color = 'text-blue-500',
  showLabel = true,
  language = 'english'
}) => {
  // Determine size class based on prop
  const sizeClass = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16'
  }[size];

  // Get rotation style based on compass heading
  const getRotationStyle = () => {
    if (compassHeading === null) return {};
    
    // The arrow should always point north, so we rotate it opposite to the compass heading
    return { transform: `rotate(${compassHeading}deg)` };
  };

  // Get cardinal direction label based on compass heading
  const getDirectionLabel = () => {
    if (compassHeading === null) return language === 'tamil' ? 'வடக்கு' : 'N';
    
    // Normalize the heading to 0-360 range
    const normalizedHeading = ((compassHeading % 360) + 360) % 360;
    
    // Determine cardinal direction
    if (normalizedHeading >= 337.5 || normalizedHeading < 22.5) {
      return language === 'tamil' ? 'வடக்கு' : 'N';
    } else if (normalizedHeading >= 22.5 && normalizedHeading < 67.5) {
      return language === 'tamil' ? 'வடகிழக்கு' : 'NE';
    } else if (normalizedHeading >= 67.5 && normalizedHeading < 112.5) {
      return language === 'tamil' ? 'கிழக்கு' : 'E';
    } else if (normalizedHeading >= 112.5 && normalizedHeading < 157.5) {
      return language === 'tamil' ? 'தென்கிழக்கு' : 'SE';
    } else if (normalizedHeading >= 157.5 && normalizedHeading < 202.5) {
      return language === 'tamil' ? 'தெற்கு' : 'S';
    } else if (normalizedHeading >= 202.5 && normalizedHeading < 247.5) {
      return language === 'tamil' ? 'தென்மேற்கு' : 'SW';
    } else if (normalizedHeading >= 247.5 && normalizedHeading < 292.5) {
      return language === 'tamil' ? 'மேற்கு' : 'W';
    } else {
      return language === 'tamil' ? 'வடமேற்கு' : 'NW';
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div style={getRotationStyle()} className="relative">
        <ArrowUp className={`${sizeClass} ${color}`} />
        {/* Small dot at the center of the arrow */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-current rounded-full"></div>
      </div>
      {showLabel && (
        <div className={`mt-1 font-bold ${color} text-center text-xs`}>
          {getDirectionLabel()}
          {compassHeading !== null && (
            <span className="ml-1 text-xs opacity-70">
              {Math.round(compassHeading)}°
            </span>
          )}
        </div>
      )}
    </div>
  );
};