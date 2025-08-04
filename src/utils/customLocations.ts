import { CustomLocation } from '../types';

const CUSTOM_LOCATIONS_KEY = 'custom_locations';

export class CustomLocationsManager {
  private static instance: CustomLocationsManager;
  private customLocations: CustomLocation[] = [];

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): CustomLocationsManager {
    if (!CustomLocationsManager.instance) {
      CustomLocationsManager.instance = new CustomLocationsManager();
    }
    return CustomLocationsManager.instance;
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(CUSTOM_LOCATIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.customLocations = parsed.map((loc: any) => ({
          ...loc,
          createdAt: new Date(loc.createdAt),
        }));
      }
    } catch (error) {
      console.error('Error loading custom locations:', error);
      this.customLocations = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(CUSTOM_LOCATIONS_KEY, JSON.stringify(this.customLocations));
    } catch (error) {
      console.error('Error saving custom locations:', error);
    }
  }

  getAllLocations(): CustomLocation[] {
    return this.customLocations.filter(loc => loc.isActive);
  }

  addLocation(location: Omit<CustomLocation, 'id' | 'createdAt' | 'isActive'>): CustomLocation {
    const newLocation: CustomLocation = {
      ...location,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      isActive: true,
    };

    this.customLocations.push(newLocation);
    this.saveToStorage();
    return newLocation;
  }

  updateLocation(id: string, updates: Partial<CustomLocation>): CustomLocation | null {
    const index = this.customLocations.findIndex(loc => loc.id === id);
    if (index === -1) return null;

    this.customLocations[index] = { ...this.customLocations[index], ...updates };
    this.saveToStorage();
    return this.customLocations[index];
  }

  deleteLocation(id: string): boolean {
    const index = this.customLocations.findIndex(loc => loc.id === id);
    if (index === -1) return false;

    this.customLocations.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  deactivateLocation(id: string): boolean {
    const location = this.customLocations.find(loc => loc.id === id);
    if (!location) return false;

    location.isActive = false;
    this.saveToStorage();
    return true;
  }

  getLocationById(id: string): CustomLocation | null {
    return this.customLocations.find(loc => loc.id === id) || null;
  }

  clearAllLocations(): void {
    this.customLocations = [];
    this.saveToStorage();
  }

  // Convert custom locations to building format for compatibility
  getCustomLocationsAsBuildings(): Record<string, any> {
    const buildings: Record<string, any> = {};
    
    this.customLocations
      .filter(loc => loc.isActive)
      .forEach(loc => {
        buildings[loc.id] = {
          name: loc.name,
          englishName: loc.englishName,
          lat: loc.lat,
          lng: loc.lng,
          description: loc.description,
          isCustom: true,
          customId: loc.id,
        };
      });

    return buildings;
  }
} 