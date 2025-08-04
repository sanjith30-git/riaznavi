import React, { useState, useEffect } from 'react';
import { MapPin, Building, Home, Coffee, Car, Shield, Calendar } from 'lucide-react';
import { buildings, buildingCategories } from '../data/campus';
import { CustomLocationsManager } from '../utils/customLocations';
import { CustomLocation } from '../types';

interface DestinationGridProps {
  onSelectDestination: (key: string) => void;
  selectedDestination: string | null;
  language: 'tamil' | 'english';
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'academic': return Building;
    case 'accommodation': return Home;
    case 'dining': return Coffee;
    case 'facilities': return Car;
    case 'venues': return MapPin;
    case 'entrances': return Shield;
    case 'events': return Calendar;
    default: return MapPin;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'academic': return 'from-blue-500 to-blue-600';
    case 'accommodation': return 'from-green-500 to-green-600';
    case 'dining': return 'from-orange-500 to-orange-600';
    case 'facilities': return 'from-purple-500 to-purple-600';
    case 'venues': return 'from-red-500 to-red-600';
    case 'entrances': return 'from-gray-500 to-gray-600';
    case 'events': return 'from-pink-500 to-pink-600';
    default: return 'from-blue-500 to-blue-600';
  }
};

export const DestinationGrid: React.FC<DestinationGridProps> = ({ 
  onSelectDestination, 
  selectedDestination,
  language
}) => {
  const [customLocations, setCustomLocations] = useState<CustomLocation[]>([]);
  const locationsManager = CustomLocationsManager.getInstance();

  useEffect(() => {
    const loadCustomLocations = () => {
      const locations = locationsManager.getAllLocations();
      setCustomLocations(locations);
    };

    loadCustomLocations();
    
    // Listen for storage changes to update custom locations
    const handleStorageChange = () => {
      loadCustomLocations();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="space-y-6">
      {/* Custom Event Locations */}
      {customLocations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-pink-500 to-pink-600">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-800">
              {language === 'tamil' ? 'நிகழ்வு இடங்கள்' : 'Event Locations'}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {customLocations.map((location) => {
              const isSelected = selectedDestination === location.id;
              
              return (
                <button
                  key={location.id}
                  onClick={() => {
                    console.log('Custom destination clicked:', location.id);
                    onSelectDestination(location.id);
                  }}
                  className={`
                    p-3 rounded-lg text-left transition-all duration-200 
                    border-2 hover:shadow-lg transform hover:-translate-y-1
                    ${isSelected 
                      ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white border-transparent shadow-lg' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="font-medium text-sm">
                    {language === 'tamil' ? location.name : location.englishName}
                  </div>
                  {location.description && (
                    <div className={`text-xs mt-1 ${isSelected ? 'text-white opacity-90' : 'text-gray-500'}`}>
                      {location.description}
                    </div>
                  )}
                  <div className={`text-xs mt-1 ${isSelected ? 'text-white opacity-70' : 'text-gray-400'}`}>
                    {language === 'tamil' ? 'நிகழ்வு இடம்' : 'Event Location'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Regular Building Categories */}
      {Object.entries(buildingCategories).map(([category, buildingKeys]) => {
        const Icon = getCategoryIcon(category);
        const colorClass = getCategoryColor(category);
        
        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${colorClass}`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 capitalize">
                {category.replace('_', ' ')}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {buildingKeys.map((key) => {
                const building = buildings[key];
                const isSelected = selectedDestination === key;
                
                return (
                  <button
                    key={key}
                    onClick={() => {
                      console.log('Destination clicked:', key);
                      onSelectDestination(key);
                    }}
                    className={`
                      p-3 rounded-lg text-left transition-all duration-200 
                      border-2 hover:shadow-lg transform hover:-translate-y-1
                      ${isSelected 
                        ? `bg-gradient-to-r ${colorClass} text-white border-transparent shadow-lg` 
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="font-medium text-sm">{language === 'tamil' ? building.name : (building.englishName || building.name)}</div>
                    {building.description && (
                      <div className={`text-xs mt-1 ${isSelected ? 'text-white opacity-90' : 'text-gray-500'}`}>
                        {building.description}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};