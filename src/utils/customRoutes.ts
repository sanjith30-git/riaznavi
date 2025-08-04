export interface RouteJoint {
  lat: number;
  lng: number;
  name: string;
  description?: string;
  type: 'start' | 'waypoint' | 'turn' | 'end';
}

export interface CustomRoute {
  id: string;
  name: string;
  description: string;
  joints: RouteJoint[];
  distance: number;
  estimatedTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  isActive: boolean;
}

export class CustomRoutesManager {
  private static instance: CustomRoutesManager;
  private customRoutes: Map<string, CustomRoute> = new Map();

  static getInstance(): CustomRoutesManager {
    if (!CustomRoutesManager.instance) {
      CustomRoutesManager.instance = new CustomRoutesManager();
    }
    return CustomRoutesManager.instance;
  }

  constructor() {
    this.initializeDefaultRoutes();
  }

  private initializeDefaultRoutes() {
    // Add some default custom routes for Arunai Engineering College
    const routes: CustomRoute[] = [
      {
        id: 'gate-to-library',
        name: 'வாயில் முதல் நூலகம் வரை',
        description: 'கல்லூரி நுழைவாயிலில் இருந்து நூலகம் வரை நடைபாதை',
        joints: [
          {
            lat: 12.193100,
            lng: 79.084515,
            name: 'கல்லூரி வாயில்',
            type: 'start'
          },
          {
            lat: 12.192850,
            lng: 79.084000,
            name: 'மைய வளாகம்',
            type: 'waypoint'
          },
          {
            lat: 12.192650,
            lng: 83.083750,
            name: 'கணினி துறை முன்',
            type: 'turn'
          },
          {
            lat: 12.192500,
            lng: 79.083500,
            name: 'நூலகம்',
            type: 'end'
          }
        ],
        distance: 240,
        estimatedTime: 3,
        difficulty: 'easy',
        isActive: true
      },
      {
        id: 'canteen-to-mech',
        name: 'உணவகம் முதல் இயந்திர துறை வரை',
        description: 'உணவகத்தில் இருந்து இயந்திர பொறியியல் துறை வரை',
        joints: [
          {
            lat: 12.192030,
            lng: 79.083649,
            name: 'அருணை உணவகம்',
            type: 'start'
          },
          {
            lat: 12.192400,
            lng: 79.083200,
            name: 'திறந்த அரங்கம் பக்கம்',
            type: 'waypoint'
          },
          {
            lat: 12.193000,
            lng: 79.082800,
            name: 'விடுதி பகுதி',
            type: 'turn'
          },
          {
            lat: 12.193446,
            lng: 79.082622,
            name: 'இயந்திர பொறியியல் துறை',
            type: 'end'
          }
        ],
        distance: 180,
        estimatedTime: 2.5,
        difficulty: 'easy',
        isActive: true
      },
      {
        id: 'hostel-to-cse',
        name: 'விடுதி முதல் கணினி துறை வரை',
        description: 'ஆண்கள் விடுதியில் இருந்து கணினி அறிவியல் துறை வரை',
        joints: [
          {
            lat: 12.192641,
            lng: 79.082147,
            name: 'ஆண்கள் விடுதி',
            type: 'start'
          },
          {
            lat: 12.192800,
            lng: 79.082500,
            name: 'விளையாட்டு மைதானம்',
            type: 'waypoint'
          },
          {
            lat: 12.192900,
            lng: 79.082800,
            name: 'மைய பாதை',
            type: 'turn'
          },
          {
            lat: 12.192838,
            lng: 79.083230,
            name: 'கணினி அறிவியல் துறை',
            type: 'end'
          }
        ],
        distance: 150,
        estimatedTime: 2,
        difficulty: 'easy',
        isActive: true
      }
    ];

    routes.forEach(route => {
      this.customRoutes.set(route.id, route);
    });
  }

  getAllRoutes(): CustomRoute[] {
    return Array.from(this.customRoutes.values()).filter(route => route.isActive);
  }

  getRoute(id: string): CustomRoute | undefined {
    return this.customRoutes.get(id);
  }

  addRoute(route: CustomRoute): void {
    this.customRoutes.set(route.id, route);
  }

  updateRoute(id: string, updates: Partial<CustomRoute>): boolean {
    const route = this.customRoutes.get(id);
    if (route) {
      this.customRoutes.set(id, { ...route, ...updates });
      return true;
    }
    return false;
  }

  deleteRoute(id: string): boolean {
    return this.customRoutes.delete(id);
  }

  getRoutesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): CustomRoute[] {
    return this.getAllRoutes().filter(route => route.difficulty === difficulty);
  }

  getRoutesByDistance(maxDistance: number): CustomRoute[] {
    return this.getAllRoutes().filter(route => route.distance <= maxDistance);
  }

  calculateRouteDistance(joints: RouteJoint[]): number {
    if (joints.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 0; i < joints.length - 1; i++) {
      const joint1 = joints[i];
      const joint2 = joints[i + 1];
      totalDistance += this.calculateDistance(joint1.lat, joint1.lng, joint2.lat, joint2.lng);
    }
    
    return Math.round(totalDistance);
  }

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
} 