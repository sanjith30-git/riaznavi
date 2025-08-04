import React, { useEffect, useRef } from 'react';
import { buildings } from '../data/campus';

interface NavigationMapProps {
  selectedDestination: string | null;
  userLocation: { lat: number; lng: number } | null;
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
  onRouteCalculated?: (distance: number, duration: number) => void;
  onNavigationInstruction?: (instruction: string, distance?: number) => void;
}

export const NavigationMap: React.FC<NavigationMapProps> = ({ 
  selectedDestination, 
  userLocation,
  onLocationUpdate,
  onRouteCalculated,
  onNavigationInstruction
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const routeControlRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const lastInstructionRef = useRef<string>('');
  const lastInstructionTimeRef = useRef<number>(0);
  const locationUpdateTimeRef = useRef<number>(0);
  const routeInstructionsRef = useRef<any[]>([]);
  const currentInstructionIndexRef = useRef<number>(0);
  const instructionProgressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const routeWaypointsRef = useRef<any[]>([]);
  const routeCoordinatesRef = useRef<any[]>([]);
  const instructionTriggerDistance = 20; // 20 meters trigger distance for waypoint instructions
  const totalDistanceRef = useRef<number>(0);
  const lastSpokenWaypointRef = useRef<number>(-1);
  const routeDeviationThreshold = 50; // 50 meters - recalculate route if user deviates
  const lastRouteRecalculationRef = useRef<number>(0);

  // Function to check if user has reached a waypoint and trigger instruction
  const checkWaypointInstruction = (userLatLng: any) => {
    if (routeInstructionsRef.current.length === 0 || routeWaypointsRef.current.length === 0) return;
    
    const currentIndex = currentInstructionIndexRef.current;
    if (currentIndex >= routeInstructionsRef.current.length) return;
    
    const instruction = routeInstructionsRef.current[currentIndex];
    if (!instruction) return;
    
    // Check if we've already spoken this waypoint
    if (lastSpokenWaypointRef.current >= currentIndex) return;
    
    // Get the waypoint for this instruction
    const waypoint = routeWaypointsRef.current[currentIndex];
    if (!waypoint) return;
    
    const distanceToWaypoint = userLatLng.distanceTo(waypoint);
    console.log(`Waypoint ${currentIndex + 1}: distance ${distanceToWaypoint}m (trigger: ${instructionTriggerDistance}m)`);
    
    // Trigger instruction when user is close enough to the waypoint
    if (distanceToWaypoint <= instructionTriggerDistance) {
      let instructionText = instruction.text || instruction.narrative || '';
      
      // Simplify and improve instructions for voice guidance
      if (instructionText.includes('left')) {
        instructionText = 'Turn left';
      } else if (instructionText.includes('right')) {
        instructionText = 'Turn right';
      } else if (instructionText.includes('straight') || instructionText.includes('continue')) {
        instructionText = 'Continue straight';
      } else if (instructionText.includes('head')) {
        instructionText = 'Start walking';
      } else if (instructionText.includes('exit')) {
        instructionText = 'Exit the traffic circle';
      } else if (instructionText.includes('arrive')) {
        instructionText = 'You have arrived at your destination';
      }
      
      // Remove distance information from instruction text
      instructionText = instructionText.replace(/for \d+\.?\d* m/, '');
      instructionText = instructionText.replace(/Continue on .* for \d+\.?\d* m/, 'Continue straight');
      
      // Send the instruction
      if (onNavigationInstruction) {
        console.log(`Waypoint reached: Sending instruction ${currentIndex + 1}/${routeInstructionsRef.current.length}: "${instructionText}" at distance ${distanceToWaypoint}m`);
        onNavigationInstruction(instructionText, distanceToWaypoint);
      }
      
      // Mark this waypoint as spoken
      lastSpokenWaypointRef.current = currentIndex;
      
      // Move to next instruction
      currentInstructionIndexRef.current++;
      
      // Check if we've completed all instructions
      if (currentInstructionIndexRef.current >= routeInstructionsRef.current.length) {
        console.log('All waypoint instructions completed');
      }
    }
  };

  // Function to start GPS-style navigation with actual waypoints
  const startGPSNavigation = (route: any, totalDistance: number) => {
    // Clear any existing timer
    if (instructionProgressTimerRef.current) {
      clearTimeout(instructionProgressTimerRef.current);
    }
    
    // Store route data
    routeInstructionsRef.current = route.instructions || [];
    routeCoordinatesRef.current = route.coordinates || [];
    currentInstructionIndexRef.current = 0;
    lastSpokenWaypointRef.current = -1;
    totalDistanceRef.current = totalDistance;
    
    // Extract waypoints from route coordinates
    routeWaypointsRef.current = [];
    if (routeCoordinatesRef.current.length > 0) {
      // Create waypoints at strategic points along the route
      const numInstructions = routeInstructionsRef.current.length;
      
      // For each instruction, find a corresponding waypoint
      for (let i = 0; i < numInstructions; i++) {
        // Calculate position along route (0 = start, 1 = end)
        const routeProgress = i / (numInstructions - 1);
        const coordIndex = Math.floor(routeProgress * (routeCoordinatesRef.current.length - 1));
        const coord = routeCoordinatesRef.current[coordIndex];
        
        if (coord) {
          const L = (window as any).L;
          routeWaypointsRef.current.push(L.latLng(coord.lat, coord.lng));
        }
      }
      
      // Add destination as final waypoint
      if (selectedDestination) {
        const target = buildings[selectedDestination];
        if (target) {
          const L = (window as any).L;
          routeWaypointsRef.current.push(L.latLng(target.lat, target.lng));
        }
      }
    }
    
    console.log(`Starting GPS navigation with ${routeInstructionsRef.current.length} instructions, ${routeWaypointsRef.current.length} waypoints, total distance: ${totalDistance}m`);
    
    // Send initial navigation start message
    if (onNavigationInstruction) {
      const startMessage = `Navigation started. Total distance: ${totalDistance > 1000 
        ? `${(totalDistance / 1000).toFixed(1)} kilometers`
        : `${Math.round(totalDistance)} meters`}. Follow the blue line on the map.`;
      console.log('Sending initial navigation message:', startMessage);
      onNavigationInstruction(startMessage, totalDistance);
    }
    
    // GPS-style instructions will be triggered when user reaches waypoints
    console.log('GPS navigation ready. Instructions will trigger when waypoints are reached.');
  };

  // Function to check if user has deviated from the route
  const checkRouteDeviation = (userLatLng: any) => {
    if (routeCoordinatesRef.current.length === 0) return false;
    
    const now = Date.now();
    // Prevent too frequent recalculations (minimum 30 seconds between recalculations)
    if (now - lastRouteRecalculationRef.current < 30000) return false;
    
    // Find the closest point on the route to the user's current location
    let minDistance = Infinity;
    let closestPoint = null;
    
    for (const coord of routeCoordinatesRef.current) {
      const L = (window as any).L;
      const routePoint = L.latLng(coord.lat, coord.lng);
      const distance = userLatLng.distanceTo(routePoint);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = routePoint;
      }
    }
    
    // If user is too far from the route, recalculate
    if (minDistance > routeDeviationThreshold) {
      console.log(`Route deviation detected: ${minDistance}m from route. Recalculating...`);
      lastRouteRecalculationRef.current = now;
      
      // Notify user about route recalculation
      if (onNavigationInstruction) {
        onNavigationInstruction('Recalculating route...', minDistance);
      }
      
      // Trigger route recalculation
      if (selectedDestination) {
        const target = buildings[selectedDestination];
        if (target) {
          const L = (window as any).L;
          const targetLatLng = L.latLng(target.lat, target.lng);
          recalculateRoute(userLatLng, targetLatLng);
        }
      }
      
      return true;
    }
    
    return false;
  };

  // Function to recalculate route
  const recalculateRoute = (startLatLng: any, endLatLng: any) => {
    if (!mapInstanceRef.current || !L.Routing) return;
    
        // Remove existing route
    if (routeControlRef.current) {
      console.log('Removing existing route control (recalculate)');
      mapInstanceRef.current.removeControl(routeControlRef.current);
      routeControlRef.current = null;
    }

    // Create new route
    routeControlRef.current = L.Routing.control({
      waypoints: [startLatLng, endLatLng],
      lineOptions: {
        styles: [{ 
          color: '#2563eb', 
          opacity: 0.8, 
          weight: 6,
          fillColor: '#3b82f6',
          fillOpacity: 0.3
        }]
      },
      routeWhileDragging: false,
      geocoder: false,
      fitSelectedRoutes: false,
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
      }),
      show: false,
      addWaypoints: false,
      createMarker: function() { return null; }
    }).addTo(mapInstanceRef.current);
    
    // Listen for new route
    routeControlRef.current.on('routesfound', (e: any) => {
      const routes = e.routes;
      if (routes.length > 0) {
        const route = routes[0];
        const distance = route.summary.totalDistance;
        const duration = route.summary.totalTime;
        
        // Restart GPS navigation with new route
        startGPSNavigation(route, distance);
        
        // Notify about new route
        if (onNavigationInstruction) {
          onNavigationInstruction(`Route recalculated. New distance: ${Math.round(distance)} meters.`, distance);
        }
      }
    });
  };

  // Function to provide GPS-style navigation feedback
  const provideNavigationFeedback = (userLatLng: any) => {
    if (routeCoordinatesRef.current.length === 0) return;
    
    // Find closest point on route
    let minDistance = Infinity;
    let closestPoint = null;
    
    for (const coord of routeCoordinatesRef.current) {
      const L = (window as any).L;
      const routePoint = L.latLng(coord.lat, coord.lng);
      const distance = userLatLng.distanceTo(routePoint);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = routePoint;
      }
    }
    
    // Provide feedback based on distance to route
    if (minDistance > 30 && minDistance <= routeDeviationThreshold) {
      console.log(`User is ${minDistance}m from route - providing guidance`);
      // Could add gentle guidance here if needed
    }
  };

  // Function to handle arrival at destination
  const handleArrival = (distance: number) => {
    // Clear any pending instructions
    if (instructionProgressTimerRef.current) {
      clearTimeout(instructionProgressTimerRef.current);
      instructionProgressTimerRef.current = null;
    }
    
    if (onNavigationInstruction) {
      onNavigationInstruction('You have arrived at your destination!', distance);
    }
  };

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Check if Leaflet and Leaflet Routing are available
    const L = (window as any).L;
    if (!L || !L.Routing) {
      console.warn('Leaflet Routing Machine not loaded yet');
      return;
    }
    
    console.log('Leaflet and Routing Machine loaded successfully');
    console.log('Available routing services:', L.Routing);

    // Initialize map with higher zoom for point-of-view navigation
    const map = L.map(mapRef.current, {
      center: [12.192850, 79.083730],
      zoom: 20, // Higher zoom for better navigation
      zoomControl: true,
      attributionControl: false
    });
    
    // Use OpenStreetMap tiles as in your original code
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 22, // Allow higher zoom levels
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Note: Device orientation/heading tracking removed as requested
    // Map will stay oriented to north for consistent navigation

    // Add building markers using your exact coordinates
    Object.entries(buildings).forEach(([key, building]) => {
      L.marker([building.lat, building.lng])
        .addTo(map)
        .bindPopup(`<b>${building.name}</b><br/>${building.description || ''}`);
    });

    mapInstanceRef.current = map;

    // Auto-detect user location with continuous tracking
    const startLocationTracking = () => {
      map.locate({ 
        setView: true,
        maxZoom: 20,
        timeout: 10000,
        maximumAge: 15000, // 15 seconds to reduce frequent updates
        enableHighAccuracy: false, // Use less accurate but more stable location
        watch: true // Enable continuous location tracking
      });
    };
    
    startLocationTracking();

    map.on('locationfound', function(e: any) {
      const detectedLocation = e.latlng;
      const now = Date.now();
      
      // Throttle location updates to every 10 seconds minimum
      if (now - locationUpdateTimeRef.current < 10000) {
        return;
      }
      locationUpdateTimeRef.current = now;
      
      const campusCenter = L.latLng(12.192850, 79.083730);
      const distance = detectedLocation.distanceTo(campusCenter);
      
      // Log distance for debugging (removed 5km limit)
      console.log(`Distance from campus: ${distance}m`);
      
      // Update user marker
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
      }
      
      // Create a directional marker showing user's heading
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `<div style="
          width: 20px; 
          height: 20px; 
          background: #4285f4; 
          border: 3px solid white; 
          border-radius: 50%; 
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          position: relative;
        ">
          <div style="
            position: absolute;
            top: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 4px solid transparent;
            border-right: 4px solid transparent;
            border-bottom: 8px solid #4285f4;
          "></div>
        </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      
      userMarkerRef.current = L.marker(detectedLocation, { icon: userIcon })
        .addTo(map)
        .bindPopup("You are here");
      
      // Keep map centered on user with smooth animation
      map.setView(detectedLocation, 20, { animate: true, duration: 0.5 });
      
      // Notify parent component of location update
      if (onLocationUpdate) {
        onLocationUpdate({ lat: detectedLocation.lat, lng: detectedLocation.lng });
      }
      
      // Check for GPS navigation waypoint instructions
      if (selectedDestination && routeInstructionsRef.current.length > 0) {
        // First check if user has deviated from route
        const hasDeviated = checkRouteDeviation(detectedLocation);
        
        // Only check waypoint instructions if not recalculating route
        if (!hasDeviated) {
          checkWaypointInstruction(detectedLocation);
          provideNavigationFeedback(detectedLocation);
        }
      }
      
      // Update route if destination is selected
      if (selectedDestination && routeControlRef.current) {
        updateRoute(detectedLocation);
      }
    });

    map.on('locationerror', function() {
      console.log("Could not detect location, using default campus center");
      
      // Notify parent component about location issue
      if (onNavigationInstruction) {
        onNavigationInstruction("Could not detect your location. Please check your location permissions and try again.", undefined);
      }
    });

    // Function to update route with new user location
    const updateRoute = (newLocation: any) => {
      if (!L.Routing) {
        console.warn('Leaflet Routing not available for route update');
        return;
      }
      
      const target = buildings[selectedDestination!];
      if (!target) return;
      
      // Remove existing route
      if (routeControlRef.current) {
        console.log('Removing existing route control (update)');
        mapInstanceRef.current.removeControl(routeControlRef.current);
        routeControlRef.current = null;
      }
      
      // Create new route with updated location
      routeControlRef.current = L.Routing.control({
        waypoints: [
          L.latLng(newLocation.lat, newLocation.lng),
          L.latLng(target.lat, target.lng)
        ],
        lineOptions: {
          styles: [{ 
            color: '#2563eb', 
            opacity: 0.8, 
            weight: 6,
            fillColor: '#3b82f6',
            fillOpacity: 0.3
          }]
        },
        routeWhileDragging: false,
        geocoder: false,
        fitSelectedRoutes: false, // Don't auto-fit to avoid constant map movement
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1'
        }),
        show: false,
        addWaypoints: false,
        createMarker: function() { return null; }
      }).addTo(mapInstanceRef.current);
      
      // Listen for route updates and provide real-time instructions
      routeControlRef.current.on('routesfound', (e: any) => {
        const routes = e.routes;
        if (routes.length > 0) {
          const route = routes[0];
          const distance = route.summary.totalDistance;
          const now = Date.now();
          
          // Check if near destination for arrival notification
          if (distance < 20) {
            handleArrival(distance);
          } else if (distance < 50) {
            if (onNavigationInstruction) {
              onNavigationInstruction('Destination ahead. You are almost there!', distance);
            }
          }
        }
      });
    };

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      // Clear any pending instruction timers
      if (instructionProgressTimerRef.current) {
        clearTimeout(instructionProgressTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;

    const L = (window as any).L;
    
    // Update user marker with provided location
    if (userMarkerRef.current) {
      mapInstanceRef.current.removeLayer(userMarkerRef.current);
    }
    
    userMarkerRef.current = L.circleMarker([userLocation.lat, userLocation.lng], {
      radius: 8,
      fillColor: 'blue',
      color: '#000',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(mapInstanceRef.current)
      .bindPopup("You are here")
      .openPopup();

    // Check for GPS navigation waypoint instructions
    if (selectedDestination && routeInstructionsRef.current.length > 0) {
      const userLatLng = L.latLng(userLocation.lat, userLocation.lng);
      
      // First check if user has deviated from route
      const hasDeviated = checkRouteDeviation(userLatLng);
      
      // Only check waypoint instructions if not recalculating route
      if (!hasDeviated) {
        checkWaypointInstruction(userLatLng);
        provideNavigationFeedback(userLatLng);
      }
    }

  }, [userLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current || !selectedDestination) return;

    const L = (window as any).L;
    if (!L || !L.Routing) {
      console.warn('Leaflet Routing Machine not available');
      return;
    }
    
    const target = buildings[selectedDestination];
    
    if (!target) return;

    // Get current user location from the map or use detected location
    let currentUserLocation = userLocation;
    if (!currentUserLocation && userMarkerRef.current) {
      currentUserLocation = userMarkerRef.current.getLatLng();
    }
    
    if (!currentUserLocation) {
      // Use default campus center if no location available
      currentUserLocation = { lat: 12.192850, lng: 79.083730 };
    }

    // Calculate distance to destination
    const startPoint = L.latLng(currentUserLocation.lat, currentUserLocation.lng);
    const endPoint = L.latLng(target.lat, target.lng);
    const distance = startPoint.distanceTo(endPoint);
    
    // Log distance for debugging (removed 5km limit)
    console.log(`Distance to destination: ${distance}m`);

    // Safely remove existing route with proper cleanup
    if (routeControlRef.current) {
      console.log('Removing existing route control');
      try {
        // Remove event listeners first
        routeControlRef.current.off('routesfound');
        routeControlRef.current.off('routingerror');
        
        // Remove fallback path if it exists
        if ((routeControlRef.current as any).fallbackPath) {
          try {
            mapInstanceRef.current?.removeLayer((routeControlRef.current as any).fallbackPath);
          } catch (e) {
            console.log('Error removing fallback path:', e);
          }
          (routeControlRef.current as any).fallbackPath = null;
        }
        
        // Remove the control
        if (mapInstanceRef.current) {
          mapInstanceRef.current.removeControl(routeControlRef.current);
        }
      } catch (e) {
        console.log('Error removing route control:', e);
      }
      routeControlRef.current = null;
    }

    // Add a small delay to prevent race conditions
    setTimeout(() => {
      if (!mapInstanceRef.current) return;
      
      console.log('Creating new routing control with waypoints:', [
        [currentUserLocation.lat, currentUserLocation.lng],
        [target.lat, target.lng]
      ]);
      
      // Create new route using your exact routing configuration
    routeControlRef.current = L.Routing.control({
      waypoints: [
        L.latLng(currentUserLocation.lat, currentUserLocation.lng),
        L.latLng(target.lat, target.lng)
      ],
      lineOptions: {
        styles: [{ 
          color: '#2563eb', 
          opacity: 0.8, 
          weight: 6,
          fillColor: '#3b82f6',
          fillOpacity: 0.3
        }]
      },
      routeWhileDragging: false,
      geocoder: false,
      fitSelectedRoutes: true,
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
      }),
      show: true,
      addWaypoints: false,
      createMarker: function() { return null; } // Hide default markers
    }).addTo(mapInstanceRef.current);

    // Add a fallback straight-line path that's always visible
    const fallbackPath = L.polyline([
      [currentUserLocation.lat, currentUserLocation.lng],
      [target.lat, target.lng]
    ], {
      color: '#dc2626',
      weight: 3,
      opacity: 0.6,
      dashArray: '5, 5'
    }).addTo(mapInstanceRef.current);
    
    // Store reference to remove later if routing succeeds
    (routeControlRef.current as any).fallbackPath = fallbackPath;

    // Listen for route found event to calculate distance and duration
    routeControlRef.current.on('routesfound', (e: any) => {
      const routes = e.routes;
      console.log('Route found:', routes);
      if (routes.length > 0) {
        const route = routes[0];
        const distance = route.summary.totalDistance;
        const duration = route.summary.totalTime;
        console.log('Route details:', { distance, duration, coordinates: route.coordinates?.length || 0 });
        
        // Remove fallback path since routing succeeded
        if ((routeControlRef.current as any).fallbackPath) {
          try {
            mapInstanceRef.current?.removeLayer((routeControlRef.current as any).fallbackPath);
          } catch (e) {
            console.log('Error removing fallback path after route found:', e);
          }
          (routeControlRef.current as any).fallbackPath = null;
        }
        
        onRouteCalculated && onRouteCalculated(distance, duration);
        
        // Start GPS-style navigation with full route data
        if (route.instructions && route.instructions.length > 0) {
          startGPSNavigation(route, distance);
        }
      }
    });

    // Add error handling for routing failures
    routeControlRef.current.on('routingerror', (e: any) => {
      console.error('Routing error:', e);
      
      // Keep the existing fallback path that was already added
      // Calculate straight-line distance
      const distance = startPoint.distanceTo(endPoint);
      const duration = distance / 1.4; // Assume 1.4 m/s walking speed
      
      onRouteCalculated && onRouteCalculated(distance, duration);
      
      if (onNavigationInstruction) {
        onNavigationInstruction('Using direct route due to routing service issue.', distance);
      }
    });
    }, 100); // Small delay to ensure cleanup is complete

  }, [selectedDestination, userLocation, onRouteCalculated]);

  // Cleanup effect when destination changes
  useEffect(() => {
    // Clear any pending instruction timers when destination changes
    if (instructionProgressTimerRef.current) {
      clearTimeout(instructionProgressTimerRef.current);
      instructionProgressTimerRef.current = null;
    }
    
    // Remove any existing fallback paths
    if (routeControlRef.current && (routeControlRef.current as any).fallbackPath) {
      try {
        mapInstanceRef.current?.removeLayer((routeControlRef.current as any).fallbackPath);
      } catch (e) {
        console.log('Error removing fallback path in cleanup:', e);
      }
      (routeControlRef.current as any).fallbackPath = null;
    }
    
    // Reset all navigation tracking
    routeInstructionsRef.current = [];
    routeCoordinatesRef.current = [];
    routeWaypointsRef.current = [];
    currentInstructionIndexRef.current = 0;
    lastSpokenWaypointRef.current = -1;
    lastRouteRecalculationRef.current = 0;
    totalDistanceRef.current = 0;
    
    console.log('Navigation reset due to destination change');
  }, [selectedDestination]);

  return (
    <div className="w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
    </div>
  );
};