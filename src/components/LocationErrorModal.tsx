import React from 'react';
import { MapPin, Wifi, WifiOff, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { LocationErrorType } from '../utils/locationService';

interface LocationErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorType: LocationErrorType;
  language: 'tamil' | 'english';
  onRetry?: () => void;
  onManualLocation?: () => void;
}

export const LocationErrorModal: React.FC<LocationErrorModalProps> = ({
  isOpen,
  onClose,
  errorType,
  language,
  onRetry,
  onManualLocation
}) => {
  if (!isOpen) return null;

  const getErrorContent = () => {
    switch (errorType) {
      case 'permission':
        return {
          icon: <MapPin className="w-12 h-12 text-red-500" />,
          title: language === 'tamil' ? 'இருப்பிட அனுமதி தேவை' : 'Location Permission Required',
          message: language === 'tamil' 
            ? 'உங்கள் இருப்பிடத்தை கண்டறிய, உங்கள் உலாவியில் இருப்பிட அனுமதியை அனுமதிக்க வேண்டும்.'
            : 'To detect your location, please allow location permission in your browser.',
          action: language === 'tamil' ? 'அனுமதியை சரிபார்க்கவும்' : 'Check Permission'
        };
      case 'unavailable':
        return {
          icon: <WifiOff className="w-12 h-12 text-orange-500" />,
          title: language === 'tamil' ? 'இருப்பிட சேவை கிடைக்கவில்லை' : 'Location Service Unavailable',
          message: language === 'tamil'
            ? 'உங்கள் சாதனத்தில் இருப்பிட சேவை இயக்கப்படவில்லை. தயவுசெய்து அதை இயக்கவும்.'
            : 'Location service is not available on your device. Please enable it.',
          action: language === 'tamil' ? 'மீண்டும் முயற்சிக்கவும்' : 'Try Again'
        };
      case 'timeout':
        return {
          icon: <AlertTriangle className="w-12 h-12 text-yellow-500" />,
          title: language === 'tamil' ? 'இருப்பிட கண்டறிதல் நேரம் முடிந்தது' : 'Location Detection Timeout',
          message: language === 'tamil'
            ? 'உங்கள் இருப்பிடத்தை கண்டறிய முடியவில்லை. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.'
            : 'Could not detect your location. Please try again.',
          action: language === 'tamil' ? 'மீண்டும் முயற்சிக்கவும்' : 'Try Again'
        };
      case 'network':
        return {
          icon: <Wifi className="w-12 h-12 text-blue-500" />,
          title: language === 'tamil' ? 'வலையமைப்பு சிக்கல்' : 'Network Issue',
          message: language === 'tamil'
            ? 'வலையமைப்பு இணைப்பில் சிக்கல் உள்ளது. தயவுசெய்து உங்கள் இணைப்பை சரிபார்க்கவும்.'
            : 'There is a network connectivity issue. Please check your connection.',
          action: language === 'tamil' ? 'மீண்டும் முயற்சிக்கவும்' : 'Try Again'
        };
      case 'too_far':
        return {
          icon: <MapPin className="w-12 h-12 text-purple-500" />,
          title: language === 'tamil' ? 'இருப்பிடம் மிகவும் தொலைவில்' : 'Location Too Far',
          message: language === 'tamil'
            ? 'உங்கள் இருப்பிடம் கல்லூரியிலிருந்து மிகவும் தொலைவில் உள்ளது. தயவுசெய்து அருகிலுள்ள இலக்கை தேர்ந்தெடுக்கவும்.'
            : 'Your location is too far from campus. Please select a nearby destination.',
          action: language === 'tamil' ? 'இலக்கை மாற்றவும்' : 'Change Destination'
        };
      default:
        return {
          icon: <AlertTriangle className="w-12 h-12 text-gray-500" />,
          title: language === 'tamil' ? 'இருப்பிட சிக்கல்' : 'Location Issue',
          message: language === 'tamil'
            ? 'உங்கள் இருப்பிடத்தை கண்டறிய முடியவில்லை. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.'
            : 'Could not detect your location. Please try again.',
          action: language === 'tamil' ? 'மீண்டும் முயற்சிக்கவும்' : 'Try Again'
        };
    }
  };

  const errorContent = getErrorContent();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {errorContent.title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Icon and Message */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            {errorContent.icon}
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            {errorContent.message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {errorContent.action}
            </button>
          )}
          
          {onManualLocation && errorType === 'too_far' && (
            <button
              onClick={onManualLocation}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors"
            >
              {language === 'tamil' ? 'கைமுறை இருப்பிடம்' : 'Manual Location'}
            </button>
          )}
          
          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg transition-colors"
          >
            {language === 'tamil' ? 'மூடு' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}; 