export interface Coord {
  x: number;
  y: number;
}

export interface SafeHaven {
  name: string;
  type: string; // "police" | "hospital" | "convenience" | "active_merchant"
  distance: string;
  coords: Coord;
}

export interface SafetyRoute {
  name: string;
  description: string;
  safetyScore: number;
  lightingLevel: "Excellent" | "Moderate" | "Poor";
  crowdVibe: "Active & Crowded" | "Sparse" | "Isolated & Silent" | string;
  distance: string;
  duration: string;
  highlights: string[];
  hazards: string[];
  safeHavens: SafeHaven[];
  coordinates: Coord[];
}

export interface SafetyReport {
  id: string;
  latitude: number; // mapped to x (10 - 90) on grid
  longitude: number; // mapped to y (10 - 90)
  type: "poor_lighting" | "harassment" | "isolated" | "heavy_crowds" | "closure";
  title: string;
  description: string;
  timestamp: string;
  upvotes: number;
  reportedBy: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model" | "system";
  message: string;
  timestamp: Date;
}

export interface SessionContact {
  name: string;
  phone: string;
  isNotified: boolean;
}
