# Location Error Handling System

This document describes the comprehensive location error handling system implemented in the Navigation Bot application.

## Overview

The location error handling system provides graceful error management for various location-related issues without killing or reloading the site. It includes:

1. **LocationErrorModal** - Modal dialogs for critical location errors
2. **LocationNotification** - Non-intrusive notifications for minor issues
3. **LocationService** - Utility class for location management and error detection
4. Enhanced error handling in NavigationBot and NavigationMap components

## Components

### LocationErrorModal

A modal component that displays location errors with appropriate actions:

- **Permission Errors**: When location permission is denied
- **Service Unavailable**: When location service is not available on device
- **Timeout Errors**: When location detection times out
- **Network Issues**: When there are connectivity problems
- **Too Far Errors**: When user is outside campus bounds
- **General Errors**: For other location-related issues

**Features:**
- Bilingual support (English/Tamil)
- Retry functionality
- Manual location option for "too far" errors
- Graceful dismissal

### LocationNotification

A non-intrusive notification component for minor location issues:

- **Success**: Location detected successfully
- **Warning**: Minor location issues
- **Error**: Location errors
- **Info**: Location status updates

**Features:**
- Auto-hide with configurable duration
- Manual dismissal
- Smooth animations
- Positioned in top-right corner

### LocationService

A utility class that provides comprehensive location management:

**Methods:**
- `isSupported()`: Check if geolocation is supported
- `checkPermission()`: Check if location permission is granted
- `getCurrentPosition()`: Get current position with error handling
- `startWatching()`: Start location watching with error handling
- `stopWatching()`: Stop location watching
- `isWithinCampusBounds()`: Check if location is within campus
- `retryLocationDetection()`: Retry with exponential backoff

**Error Types:**
- `permission`: Location permission denied
- `unavailable`: Location service unavailable
- `timeout`: Location detection timeout
- `network`: Network connectivity issues
- `too_far`: Location outside campus bounds
- `general`: Other location errors

## Error Handling Flow

1. **Location Detection Attempt**
   - NavigationMap attempts to get user location
   - If successful, location is updated and navigation proceeds
   - If failed, error is caught and categorized

2. **Error Categorization**
   - Error code is analyzed to determine error type
   - Appropriate error message is generated
   - Error is logged for debugging

3. **User Notification**
   - Critical errors (permission, unavailable) show modal
   - Minor errors (timeout, network) show notification
   - Error message is added to chat
   - Speech synthesis announces error

4. **Recovery Options**
   - Retry button for most errors
   - Manual location option for "too far" errors
   - Graceful fallback to default campus center
   - No site reload or crash

## Usage Examples

### Basic Error Handling

```typescript
import { LocationService } from '../utils/locationService';

const locationService = LocationService.getInstance();

try {
  const position = await locationService.getCurrentPosition();
  // Handle successful location detection
} catch (error) {
  // Error is automatically categorized and handled
  const locationError = error as LocationError;
  handleLocationError(locationError.type);
}
```

### Modal Error Display

```typescript
<LocationErrorModal
  isOpen={locationError.isOpen}
  onClose={closeLocationError}
  errorType={locationError.type}
  language={navState.language}
  onRetry={handleRetryLocation}
  onManualLocation={handleManualLocation}
/>
```

### Notification Display

```typescript
<LocationNotification
  message="Location detected successfully!"
  type="success"
  isVisible={true}
  onClose={closeNotification}
  autoHide={true}
  duration={5000}
/>
```

## Error Messages

### English Messages
- Permission: "Location permission denied. Please enable location access in your browser settings."
- Unavailable: "Location service unavailable. Please check your device location settings."
- Timeout: "Location detection timed out. Please try again."
- Network: "Network issue. Please check your connection."
- Too Far: "Your location is too far from campus. Please select a nearby destination."

### Tamil Messages
- Permission: "இருப்பிட அனுமதி மறுக்கப்பட்டது. தயவுசெய்து உங்கள் உலாவி அமைப்புகளில் இருப்பிட அனுமதியை இயக்கவும்."
- Unavailable: "இருப்பிட சேவை கிடைக்கவில்லை. தயவுசெய்து உங்கள் சாதனத்தில் இருப்பிட சேவையை இயக்கவும்."
- Timeout: "இருப்பிட கண்டறிதல் நேரம் முடிந்தது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்."
- Network: "வலையமைப்பு சிக்கல். தயவுசெய்து உங்கள் இணைப்பை சரிபார்க்கவும்."
- Too Far: "உங்கள் இருப்பிடம் கல்லூரியிலிருந்து மிகவும் தொலைவில் உள்ளது. தயவுசெய்து அருகிலுள்ள இலக்கை தேர்ந்தெடுக்கவும்."

## Benefits

1. **Non-Disruptive**: Errors don't crash or reload the application
2. **User-Friendly**: Clear, actionable error messages
3. **Bilingual**: Support for English and Tamil
4. **Accessible**: Speech synthesis for visually impaired users
5. **Recoverable**: Multiple retry and recovery options
6. **Graceful**: Fallback to default location when needed
7. **Informative**: Detailed error categorization and logging

## Configuration

The system can be configured through various parameters:

- **Retry Attempts**: Maximum number of retry attempts (default: 3)
- **Timeout Duration**: Location detection timeout (default: 10 seconds)
- **Campus Radius**: Maximum distance from campus center (default: 5km)
- **Notification Duration**: Auto-hide duration for notifications (default: 5 seconds)
- **High Accuracy**: Whether to use high accuracy mode (default: false)

## Future Enhancements

1. **Offline Support**: Cache location data for offline use
2. **Predictive Location**: Use device sensors for better location estimation
3. **Custom Error Handling**: Allow custom error handling per error type
4. **Analytics**: Track location error patterns for improvement
5. **Progressive Enhancement**: Fallback to IP-based location when GPS fails 