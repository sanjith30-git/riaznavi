import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit, MapPin, Settings } from 'lucide-react';
import { CustomLocationsManager } from '../utils/customLocations';
import { CustomLocation } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'tamil' | 'english';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  language 
}) => {
  const [customLocations, setCustomLocations] = useState<CustomLocation[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<CustomLocation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    englishName: '',
    lat: '',
    lng: '',
    description: ''
  });

  const locationsManager = CustomLocationsManager.getInstance();

  useEffect(() => {
    if (isOpen) {
      loadCustomLocations();
    }
  }, [isOpen]);

  const loadCustomLocations = () => {
    const locations = locationsManager.getAllLocations();
    setCustomLocations(locations);
  };

  const handleAddLocation = () => {
    if (!formData.name || !formData.englishName || !formData.lat || !formData.lng) {
      alert(language === 'tamil' ? 'தயவுசெய்து அனைத்து புலங்களையும் நிரப்பவும்' : 'Please fill all fields');
      return;
    }

    const lat = parseFloat(formData.lat);
    const lng = parseFloat(formData.lng);

    if (isNaN(lat) || isNaN(lng)) {
      alert(language === 'tamil' ? 'தவறான ஆயத்தொலைவுகள்' : 'Invalid coordinates');
      return;
    }

    if (editingLocation) {
      locationsManager.updateLocation(editingLocation.id, {
        name: formData.name,
        englishName: formData.englishName,
        lat,
        lng,
        description: formData.description
      });
    } else {
      locationsManager.addLocation({
        name: formData.name,
        englishName: formData.englishName,
        lat,
        lng,
        description: formData.description
      });
    }

    resetForm();
    loadCustomLocations();
  };

  const handleEditLocation = (location: CustomLocation) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      englishName: location.englishName,
      lat: location.lat.toString(),
      lng: location.lng.toString(),
      description: location.description
    });
    setShowAddForm(true);
  };

  const handleDeleteLocation = (id: string) => {
    if (confirm(language === 'tamil' ? 'இந்த இடத்தை நீக்க விரும்புகிறீர்களா?' : 'Are you sure you want to delete this location?')) {
      locationsManager.deleteLocation(id);
      loadCustomLocations();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      englishName: '',
      lat: '',
      lng: '',
      description: ''
    });
    setEditingLocation(null);
    setShowAddForm(false);
  };

  const handleCancel = () => {
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {language === 'tamil' ? 'அமைப்புகள்' : 'Settings'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Custom Locations Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {language === 'tamil' ? 'நிகழ்வு இடங்கள்' : 'Event Locations'}
              </h3>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'tamil' ? 'புதிய இடம் சேர்' : 'Add Location'}</span>
              </button>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-4">
                  {editingLocation 
                    ? (language === 'tamil' ? 'இடத்தைத் திருத்து' : 'Edit Location')
                    : (language === 'tamil' ? 'புதிய இடம் சேர்' : 'Add New Location')
                  }
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'tamil' ? 'பெயர் (தமிழ்)' : 'Name (Tamil)'}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={language === 'tamil' ? 'எ.கா: நிகழ்வு மையம்' : 'e.g., Event Center'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'tamil' ? 'பெயர் (ஆங்கிலம்)' : 'Name (English)'}
                    </label>
                    <input
                      type="text"
                      value={formData.englishName}
                      onChange={(e) => setFormData({ ...formData, englishName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Event Center"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'tamil' ? 'அட்சரேகை' : 'Latitude'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.lat}
                      onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="12.192850"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'tamil' ? 'தீர்க்கரேகை' : 'Longitude'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.lng}
                      onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="79.083730"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'tamil' ? 'விளக்கம்' : 'Description'}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={language === 'tamil' ? 'இடத்தின் விளக்கம்...' : 'Description of the location...'}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 mt-4">
                  <button
                    onClick={handleAddLocation}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    {editingLocation 
                      ? (language === 'tamil' ? 'புதுப்பி' : 'Update')
                      : (language === 'tamil' ? 'சேர்' : 'Add')
                    }
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    {language === 'tamil' ? 'ரத்து' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}

            {/* Custom Locations List */}
            <div className="space-y-3">
              {customLocations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>{language === 'tamil' ? 'இன்னும் நிகழ்வு இடங்கள் சேர்க்கப்படவில்லை' : 'No event locations added yet'}</p>
                </div>
              ) : (
                customLocations.map((location) => (
                  <div key={location.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{location.name}</h4>
                        <p className="text-sm text-gray-600">{location.englishName}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                        </p>
                        {location.description && (
                          <p className="text-sm text-gray-600 mt-1">{location.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditLocation(location)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLocation(location.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 