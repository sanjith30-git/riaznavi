import React from 'react';
import { MapPin, Navigation, X, CheckCircle, AlertCircle } from 'lucide-react';

interface NavigationStatusProps {
  isVisible: boolean;
  type: 'cancelled' | 'new-destination' | 'calculating' | 'error';
  message: string;
  onClose?: () => void;
  language: 'tamil' | 'english';
}

export const NavigationStatus: React.FC<NavigationStatusProps> = ({
  isVisible,
  type,
  message,
  onClose,
  language
}) => {
  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'cancelled':
        return <X className="w-5 h-5 text-red-500" />;
      case 'new-destination':
        return <MapPin className="w-5 h-5 text-blue-500" />;
      case 'calculating':
        return <Navigation className="w-5 h-5 text-green-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'cancelled':
        return 'bg-red-50 border-red-200';
      case 'new-destination':
        return 'bg-blue-50 border-blue-200';
      case 'calculating':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`
      fixed top-4 left-1/2 transform -translate-x-1/2 z-50
      p-4 rounded-lg border shadow-lg max-w-sm w-full mx-4
      animate-in slide-in-from-top-2 duration-300
      ${getBackgroundColor()}
    `}>
      <div className="flex items-center space-x-3">
        {getIcon()}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800">
            {message}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}; 