import React, { useState } from 'react';
import { DirectionalArrow } from './DirectionalArrow';

interface DirectionalArrowTestProps {
  language: 'tamil' | 'english';
}

export const DirectionalArrowTest: React.FC<DirectionalArrowTestProps> = ({ language }) => {
  const [currentDirection, setCurrentDirection] = useState<'left' | 'right' | 'straight' | 'back' | 'slight-left' | 'slight-right' | 'sharp-left' | 'sharp-right' | 'arrive'>('straight');
  const [showDistance, setShowDistance] = useState(true);
  const [distanceValue, setDistanceValue] = useState(250); // Default 250 meters

  const directions: Array<'left' | 'right' | 'straight' | 'back' | 'slight-left' | 'slight-right' | 'sharp-left' | 'sharp-right' | 'arrive'> = [
    'left', 'right', 'straight', 'back', 'slight-left', 'slight-right', 'sharp-left', 'sharp-right', 'arrive'
  ];

  const getDirectionLabel = (direction: string) => {
    switch (direction) {
      case 'left':
        return language === 'tamil' ? 'இடது' : 'Left';
      case 'right':
        return language === 'tamil' ? 'வலது' : 'Right';
      case 'straight':
        return language === 'tamil' ? 'நேராக' : 'Straight';
      case 'back':
        return language === 'tamil' ? 'பின்னால்' : 'Back';
      case 'slight-left':
        return language === 'tamil' ? 'சற்று இடது' : 'Slight Left';
      case 'slight-right':
        return language === 'tamil' ? 'சற்று வலது' : 'Slight Right';
      case 'sharp-left':
        return language === 'tamil' ? 'கூர்மையான இடது' : 'Sharp Left';
      case 'sharp-right':
        return language === 'tamil' ? 'கூர்மையான வலது' : 'Sharp Right';
      case 'arrive':
        return language === 'tamil' ? 'வந்துவிட்டீர்கள்' : 'Arrived';
      default:
        return direction;
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">
        {language === 'tamil' ? 'திசை அம்புகள் சோதனை' : 'Direction Arrows Test'}
      </h2>
      
      <div className="flex flex-col items-center justify-center p-8 bg-black rounded-lg mb-4">
        <DirectionalArrow 
          direction={currentDirection} 
          size="xlarge" 
          animate={true} 
          color="text-yellow-400" 
          distance={showDistance ? distanceValue : undefined}
          language={language}
        />
        <div className="mt-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-center">
          {getDirectionLabel(currentDirection)}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-4">
        {directions.map((direction) => (
          <button
            key={direction}
            onClick={() => setCurrentDirection(direction)}
            className={`p-2 rounded-lg ${currentDirection === direction ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            {getDirectionLabel(direction)}
          </button>
        ))}
      </div>
      
      <div className="mt-4 border-t pt-4">
        <h3 className="text-lg font-semibold mb-2">
          {language === 'tamil' ? 'தூர அமைப்புகள்' : 'Distance Settings'}
        </h3>
        
        <div className="flex items-center mb-2">
          <input 
            type="checkbox" 
            id="show-distance" 
            checked={showDistance} 
            onChange={() => setShowDistance(!showDistance)} 
            className="mr-2"
          />
          <label htmlFor="show-distance">
            {language === 'tamil' ? 'தூரத்தைக் காட்டு' : 'Show Distance'}
          </label>
        </div>
        
        <div className="mb-4">
          <label className="block mb-1">
            {language === 'tamil' ? 'தூரம் (மீட்டர்)' : 'Distance (meters)'}
          </label>
          <div className="flex items-center">
            <input 
              type="range" 
              min="10" 
              max="2000" 
              value={distanceValue} 
              onChange={(e) => setDistanceValue(parseInt(e.target.value))} 
              className="w-full mr-2"
              disabled={!showDistance}
            />
            <span className="w-16 text-right">{distanceValue}m</span>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {[100, 250, 500, 1000].map((distance) => (
            <button
              key={distance}
              onClick={() => setDistanceValue(distance)}
              className={`p-2 rounded-lg ${distanceValue === distance ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
              disabled={!showDistance}
            >
              {distance >= 1000 ? `${distance/1000}km` : `${distance}m`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};