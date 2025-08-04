import React from 'react';
import { MapPin, Clock, TrendingUp, Route } from 'lucide-react';
import { CustomRoutesManager, CustomRoute } from '../utils/customRoutes';

interface CustomRoutesGridProps {
  onSelectRoute: (route: CustomRoute) => void;
  selectedRouteId?: string;
  language: 'tamil' | 'english';
}

export const CustomRoutesGrid: React.FC<CustomRoutesGridProps> = ({
  onSelectRoute,
  selectedRouteId,
  language
}) => {
  const customRoutesManager = CustomRoutesManager.getInstance();
  const routes = customRoutesManager.getAllRoutes();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    if (language === 'tamil') {
      switch (difficulty) {
        case 'easy':
          return 'எளிது';
        case 'medium':
          return 'நடுத்தரம்';
        case 'hard':
          return 'கடினம்';
        default:
          return 'தெரியவில்லை';
      }
    } else {
      return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    }
  };

  if (routes.length === 0) {
    return (
      <div className="text-center py-8">
        <Route className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">
          {language === 'tamil' 
            ? 'தனிப்பயன் வழிகள் எதுவும் கிடைக்கவில்லை' 
            : 'No custom routes available'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {routes.map((route) => (
        <div
          key={route.id}
          onClick={() => onSelectRoute(route)}
          className={`
            bg-white rounded-xl shadow-md border-2 cursor-pointer transition-all duration-300
            hover:shadow-lg hover:scale-105 transform
            ${selectedRouteId === route.id 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-blue-300'
            }
          `}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-800 text-sm">
                  {route.name}
                </h3>
              </div>
              <span className={`
                px-2 py-1 rounded-full text-xs font-medium
                ${getDifficultyColor(route.difficulty)}
              `}>
                {getDifficultyText(route.difficulty)}
              </span>
            </div>
            <p className="text-gray-600 text-xs leading-relaxed">
              {route.description}
            </p>
          </div>

          {/* Route Info */}
          <div className="p-4">
            <div className="space-y-2">
              {/* Distance */}
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">
                  {route.distance}m
                </span>
              </div>

              {/* Time */}
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-700">
                  {route.estimatedTime} {language === 'tamil' ? 'நிமிடங்கள்' : 'min'}
                </span>
              </div>

              {/* Joints */}
              <div className="flex items-center space-x-2">
                <Route className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-700">
                  {route.joints.length} {language === 'tamil' ? 'புள்ளிகள்' : 'waypoints'}
                </span>
              </div>
            </div>

            {/* Joints Preview */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-1">
                {route.joints.slice(0, 3).map((joint, index) => (
                  <div key={index} className="flex items-center">
                    <div className={`
                      w-2 h-2 rounded-full
                      ${joint.type === 'start' ? 'bg-green-500' :
                        joint.type === 'end' ? 'bg-red-500' :
                        joint.type === 'turn' ? 'bg-yellow-500' :
                        'bg-blue-500'}
                    `} />
                    {index < route.joints.length - 1 && (
                      <div className="w-4 h-0.5 bg-gray-300 mx-1" />
                    )}
                  </div>
                ))}
                {route.joints.length > 3 && (
                  <span className="text-xs text-gray-500 ml-1">
                    +{route.joints.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 