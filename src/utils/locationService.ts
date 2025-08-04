export type LocationErrorType = 'permission' | 'unavailable' | 'timeout' | 'network' | 'too_far' | 'general';

export interface LocationError {
  type: LocationErrorType;
  message: string;
  code?: number;
}

export class LocationService {
  private static instance: LocationService;
  private locationWatcher: number | null = null;
  private retryCount = 0;
  private maxRetries = 3;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  // Check if geolocation is supported
  isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  // Check if location permission is granted
  async checkPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      // Try to get current position with a short timeout to check permission
      await this.getCurrentPosition({ timeout: 1000, maximumAge: 0 });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get current position with error handling
  async getCurrentPosition(options: PositionOptions = {}): Promise<GeolocationPosition> {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported');
    }

    return new Promise((resolve, reject) => {
      const defaultOptions: PositionOptions = {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 30000,
        ...options
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.retryCount = 0; // Reset retry count on success
          resolve(position);
        },
        (error) => {
          const locationError = this.handleLocationError(error);
          reject(locationError);
        },
        defaultOptions
      );
    });
  }

  // Start watching location with error handling
  startWatching(
    onSuccess: (position: GeolocationPosition) => void,
    onError: (error: LocationError) => void,
    options: PositionOptions = {}
  ): number {
    if (!this.isSupported()) {
      onError({
        type: 'unavailable',
        message: 'Geolocation is not supported on this device'
      });
      return -1;
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 15000,
      ...options
    };

    this.locationWatcher = navigator.geolocation.watchPosition(
      (position) => {
        this.retryCount = 0; // Reset retry count on success
        onSuccess(position);
      },
      (error) => {
        const locationError = this.handleLocationError(error);
        onError(locationError);
      },
      defaultOptions
    );

    return this.locationWatcher;
  }

  // Stop watching location
  stopWatching(): void {
    if (this.locationWatcher !== null) {
      navigator.geolocation.clearWatch(this.locationWatcher);
      this.locationWatcher = null;
    }
  }

  // Handle different types of geolocation errors
  private handleLocationError(error: GeolocationPositionError): LocationError {
    let errorType: LocationErrorType = 'general';
    let message = 'Unknown location error';

    switch (error.code) {
      case GeolocationPositionError.PERMISSION_DENIED:
        errorType = 'permission';
        message = 'Location permission denied. Please enable location access in your browser settings.';
        break;
      case GeolocationPositionError.POSITION_UNAVAILABLE:
        errorType = 'unavailable';
        message = 'Location information is unavailable. Please check your device location settings.';
        break;
      case GeolocationPositionError.TIMEOUT:
        errorType = 'timeout';
        message = 'Location request timed out. Please try again.';
        break;
      default:
        errorType = 'general';
        message = 'Failed to get location. Please try again.';
    }

    return {
      type: errorType,
      message,
      code: error.code
    };
  }

  // Check if location is within campus bounds
  isWithinCampusBounds(lat: number, lng: number): boolean {
    // Campus center coordinates
    const campusCenter = { lat: 12.192850, lng: 79.083730 };
    const maxDistance = 5000; // 5km radius

    const distance = this.calculateDistance(
      lat, lng,
      campusCenter.lat, campusCenter.lng
    );

    return distance <= maxDistance;
  }

  // Calculate distance between two points using Haversine formula
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Retry location detection with exponential backoff
  async retryLocationDetection(
    onSuccess: (position: GeolocationPosition) => void,
    onError: (error: LocationError) => void
  ): Promise<void> {
    if (this.retryCount >= this.maxRetries) {
      onError({
        type: 'timeout',
        message: 'Maximum retry attempts reached. Please check your location settings.'
      });
      return;
    }

    this.retryCount++;
    const delay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff

    setTimeout(async () => {
      try {
        const position = await this.getCurrentPosition();
        onSuccess(position);
      } catch (error) {
        onError(error as LocationError);
      }
    }, delay);
  }

  // Reset retry count
  resetRetryCount(): void {
    this.retryCount = 0;
  }
} 