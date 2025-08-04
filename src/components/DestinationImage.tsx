import React from 'react';
import { MapPin, X } from 'lucide-react';

interface DestinationImageProps {
  imageUrl: string;
  destinationName: string;
  englishName?: string;
  description?: string;
  language: 'tamil' | 'english';
  onClose?: () => void;
}

export const DestinationImage: React.FC<DestinationImageProps> = ({
  imageUrl,
  destinationName,
  englishName,
  description,
  language,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <div>
                <h3 className="font-semibold text-lg">
                  {language === 'tamil' ? destinationName : (englishName || destinationName)}
                </h3>
                {englishName && language === 'tamil' && (
                  <p className="text-sm text-blue-100">{englishName}</p>
                )}
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Image */}
        <div className="relative">
          <img
            src={imageUrl}
            alt={language === 'tamil' ? destinationName : (englishName || destinationName)}
            className="w-full h-64 object-cover"
            onError={(e) => {
              console.error('Image loading error:', imageUrl, e);
              const target = e.target as HTMLImageElement;
              target.src = '/Images/arunai center jpeg.jpeg'; // Fallback image
            }}
            onLoad={() => {
              console.log('Image loaded successfully:', imageUrl);
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        {/* Description */}
        {description && (
          <div className="p-4">
            <p className="text-gray-700 text-sm leading-relaxed">
              {description}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-center">
            <div className="text-center">
              <p className="text-xs text-gray-500">
                {language === 'tamil' ? 'அருணை பொறியியல் கல்லூரி' : 'Arunai Engineering College'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 