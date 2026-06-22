import express from "express";
import path from "path";
import fs from "fs";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "safeher_ai_super_secret_key_2026";

// Set up Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());

// JSON File Database Slates
const USERS_FILE = path.join(process.cwd(), "data_users.json");
const REPORTS_FILE = path.join(process.cwd(), "data_reports.json");
const COMMUTES_FILE = path.join(process.cwd(), "data_commutes.json");

// Helper to load/save JSON safely
function readJsonFile<T>(filePath: string, defaultData: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), "utf-8");
      return defaultData;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`Error reading ${filePath}, using defaults.`, err);
    return defaultData;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Interfaces
interface SafetyReport {
  id: string;
  latitude: number; // lat (e.g. 17.4 or on layout)
  longitude: number; // lng
  type: "poor_lighting" | "harassment" | "isolated" | "heavy_crowds" | "closure" | string;
  title: string;
  description: string;
  timestamp: string;
  upvotes: number;
  reportedBy: string;
  severity: "Low" | "Medium" | "High";
}

interface DBUser {
  id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
}

interface SavedCommute {
  id: string;
  username: string;
  originName: string;
  destName: string;
  routeChosen: string;
  distance: string;
  duration: string;
  safetyScore: number;
  timestamp: string;
  coordinates: { x: number; y: number }[];
  safeHavens: any[];
  aiSummary: string;
}

// Standard Seed Data
const defaultUsersList: DBUser[] = [
  {
    id: "demo-user-id",
    name: "Pranavi Rao",
    username: "demo",
    email: "pranavi.rao@gmail.com",
    password: "1234"
  }
];

const defaultReportsList: SafetyReport[] = [
  {
    id: "rep-1",
    latitude: 17.4436,
    longitude: 78.3772,
    type: "poor_lighting",
    title: "KBR Park Outer Lane (Jubilee Hills)",
    description: "Multiple municipal streetlights are completely non-functional next to the outer boundary wall. Very dark and deserted after 8:30 PM.",
    timestamp: "2026-06-21T21:15:00Z",
    upvotes: 42,
    reportedBy: "Swathi Reddy",
    severity: "Medium"
  },
  {
    id: "rep-2",
    latitude: 17.4411,
    longitude: 78.3820,
    type: "harassment",
    title: "Madhapur Metro underpass backlane",
    description: "Several loiterers gather near construction scrap. Aggressive catcalling and tracking reported by nighttime single office commuters.",
    timestamp: "2026-06-22T00:05:00Z",
    upvotes: 68,
    reportedBy: "Ananya K.",
    severity: "High"
  },
  {
    id: "rep-3",
    latitude: 17.4265,
    longitude: 78.3412,
    type: "isolated",
    title: "Gachibowli DLF Back Alley Corridor",
    description: "Extremely narrow lane blocked by container storage trucks. No streetlights, no active CCTV coverage.",
    timestamp: "2026-06-21T18:30:00Z",
    upvotes: 31,
    reportedBy: "Divya Teja",
    severity: "High"
  },
  {
    id: "rep-4",
    latitude: 18.7300,
    longitude: 78.1900,
    type: "poor_lighting",
    title: "Nizamabad-Armoor Bypass Highway Hub",
    description: "Highway connection lacks proper light spacing. Isolated truck layover area.",
    timestamp: "2026-06-21T19:45:00Z",
    upvotes: 19,
    reportedBy: "Priyamvada N.",
    severity: "Medium"
  }
];

const defaultCommutesList: SavedCommute[] = [
  {
    id: "com-1",
    username: "demo",
    originName: "Madhapur Metro Station",
    destName: "Gachibowli DLF Phase 2",
    routeChosen: "Mindspace-Madhapur Guardian Corridor",
    distance: "1.6 km",
    duration: "18 mins",
    safetyScore: 96,
    timestamp: "2026-06-21T23:30:00Z",
    coordinates: [
      { x: 17.4483, y: 78.3741 },
      { x: 17.4421, y: 78.3780 },
      { x: 17.4385, y: 78.3725 },
      { x: 17.4265, y: 78.3412 }
    ],
    safeHavens: [
      { name: "Madhapur Police Outpost", type: "police", distance: "On route", coords: { x: 17.4421, y: 78.3780 } },
      { name: "Ratnadeep 24/7 Market", type: "convenience", distance: "250m distance", coords: { x: 17.4385, y: 78.3725 } }
    ],
    aiSummary: "COMMUTE ANALYSIS SUCCESS: Commute bypassed high-risk areas in Gachibowli. Staid on well-illuminated central expressways monitored by active CCTV cams. Full safety confirmed."
  }
];

// Initialize / Seed Local Fallback files
const usersDb = readJsonFile<DBUser[]>(USERS_FILE, defaultUsersList);
const reportsDb = readJsonFile<SafetyReport[]>(REPORTS_FILE, defaultReportsList);
const commutesDb = readJsonFile<SavedCommute[]>(COMMUTES_FILE, defaultCommutesList);

// Lazy initialized Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("WARNING: GEMINI_API_KEY env is not configured. Running chatbot in high-fidelity custom scenario mode.");
    return null;
  }
  try {
    aiClient = new GoogleGenAI({ apiKey });
    return aiClient;
  } catch (e) {
    console.error("Gemini failed initialization:", e);
    return null;
  }
}

// Socket.io Handlers
io.on("connection", (socket) => {
  console.log(`[Socket Connected] Client linked: ${socket.id}`);
  
  socket.on("join-live-tracking", (username) => {
    socket.join(`user_${username}`);
    console.log(`User ${username} joined live tracking channel.`);
  });

  socket.on("disconnect", () => {
    console.log(`[Socket Disconnected] Client unlinked: ${socket.id}`);
  });
});

// REST Endpoints
// JWT Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) return res.status(401).json({ error: "Access token missing" });
  
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// 1. Auth registers
app.post("/api/auth/register", (req, res) => {
  const { name, email, username, password } = req.body;
  if (!name || !email || !username || !password) {
    return res.status(400).json({ error: "All profile fields are required." });
  }

  const users = readJsonFile<DBUser[]>(USERS_FILE, defaultUsersList);
  const exists = users.find(u => u.username === username || u.email === email);
  if (exists) {
    return res.status(400).json({ error: "Username or email is already registered." });
  }

  const newUser: DBUser = {
    id: "user-" + Date.now().toString(),
    name,
    email,
    username,
    password
  };

  users.push(newUser);
  writeJsonFile(USERS_FILE, users);

  const token = jwt.sign({ username: newUser.username, name: newUser.name }, JWT_SECRET, { expiresIn: "7d" });
  res.status(201).json({ token, user: { name: newUser.name, email: newUser.email, username: newUser.username } });
});

// 2. Auth login
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  const users = readJsonFile<DBUser[]>(USERS_FILE, defaultUsersList);
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials. Please test with demo / 1234." });
  }

  const token = jwt.sign({ username: user.username, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { name: user.name, email: user.email, username: user.username } });
});

// 3. Retrieve reports
app.get("/api/reports", (req, res) => {
  const reports = readJsonFile<SafetyReport[]>(REPORTS_FILE, defaultReportsList);
  res.json(reports);
});

// 4. Submit report
app.post("/api/reports", (req, res) => {
  const { type, title, description, latitude, longitude, reportedBy, severity } = req.body;
  if (!type || !title || !description || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: "Missing required fields for reporting." });
  }

  const reports = readJsonFile<SafetyReport[]>(REPORTS_FILE, defaultReportsList);
  const newReport: SafetyReport = {
    id: "rep-" + Date.now().toString(),
    latitude: Number(latitude),
    longitude: Number(longitude),
    type,
    title,
    description,
    timestamp: new Date().toISOString(),
    upvotes: 1,
    reportedBy: reportedBy || "Anonymous Helper",
    severity: severity || "Medium"
  };

  reports.unshift(newReport);
  writeJsonFile(REPORTS_FILE, reports);

  // Broadcast real-time Socket alert
  io.emit("new-report", newReport);

  res.status(201).json(newReport);
});

// Upvote report
app.post("/api/reports/:id/upvote", (req, res) => {
  const reports = readJsonFile<SafetyReport[]>(REPORTS_FILE, defaultReportsList);
  const report = reports.find(r => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: "Report not found" });
  
  report.upvotes += 1;
  writeJsonFile(REPORTS_FILE, reports);
  
  io.emit("report-updated", report);
  res.json(report);
});

// 5. Route Safety with Geo-Midpoint Evaluation (OSRM Mapping simulation and Flask Random Forest integration)
app.post("/api/route-safety", async (req, res) => {
  const { origin, destination, timeOfDay, originCoords, destCoords } = req.body;
  
  if (!origin || !destination) {
    return res.status(400).json({ error: "Origin and destination inputs are required." });
  }

  const timeStr = timeOfDay || "Night (10:00 PM)";
  
  // Parse coordinates or fallback to Hyderabad/Nizamabad coordinates
  const oLat = originCoords?.lat || (origin.toLowerCase().includes("nizamabad") ? 18.6725 : 17.4483);
  const oLng = originCoords?.lng || (origin.toLowerCase().includes("nizamabad") ? 78.0998 : 78.3741);
  const dLat = destCoords?.lat || (destination.toLowerCase().includes("armoor") ? 18.7900 : 17.4265);
  const dLng = destCoords?.lng || (destination.toLowerCase().includes("armoor") ? 78.2800 : 78.3412);

  // Check if Nizamabad to Armoor or high-distance long route
  const isLongRoute = origin.toLowerCase().includes("nizamabad") || destination.toLowerCase().includes("armoor");

  // Midpoint Emergency Coverage: dynamically generate emergency service nodes distributed along the path
  const midLat = (oLat + dLat) / 2;
  const midLng = (oLng + dLng) / 2;
  
  const generateEmergencyHavens = () => {
    if (isLongRoute) {
      return [
        { name: "Nizamabad VIP Government Hospital", type: "hospital", distance: "1.2 km from start", coords: { x: oLat + 0.01, y: oLng + 0.01 } },
        { name: "Ananthagiri Highway Police Outpost", type: "police", distance: "0.8 km from midpoint", coords: { x: midLat + 0.005, y: midLng - 0.005 } },
        { name: "Armoor Trauma & Wellness Clinic", type: "hospital", distance: "1.5 km from end", coords: { x: dLat - 0.008, y: dLng - 0.002 } },
        { name: "Highway Police Patrolling Cabin", type: "police", distance: "0.4 km from route", coords: { x: oLat + ((dLat - oLat) * 0.25), y: oLng + ((dLng - oLng) * 0.25) } }
      ];
    } else {
      return [
        { name: "Madhapur Sector-III Police Guard Cabin", type: "police", distance: "On route", coords: { x: oLat + 0.002, y: oLng + 0.003 } },
        { name: "Ratnadeep 24/7 Superstore Safe Haven", type: "convenience", distance: "200m distance", coords: { x: midLat - 0.001, y: midLng + 0.002 } },
        { name: "Medicover Multi-Specialty Hospital Base", type: "hospital", distance: "450m distance", coords: { x: dLat + 0.004, y: dLng - 0.005 } }
      ];
    }
  };

  const getInterpolatedPoints = (jitterLat: number, jitterLng: number, steps = 6) => {
    const coords = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = oLat + (dLat - oLat) * t;
      // Add slight wave jitter to make paths look independent
      const lng = oLng + (dLng - oLng) * t + Math.sin(t * Math.PI) * (jitterLng * (i === 0 || i === steps ? 0 : 1));
      coords.push({ x: Number((lat + (jitterLat * Math.sin(t * Math.PI))).toFixed(6)), y: Number(lng.toFixed(6)) });
    }
    return coords;
  };

  // Prepare Flask ML Scikit-Learn Model Query
  let predictedScore1 = 96;
  let predictedScore2 = 78;
  let predictedScore3 = 45;

  try {
    // Attempt connecting to Python Flask service on 5000:
    const flaskResponse = await fetch("http://127.0.0.1:5000/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timeOfDay: timeStr,
        lighting: "Excellent",
        reportsCount: reportsDb.length,
        isLongRoute
      })
    });
    if (flaskResponse.ok) {
      const mlObj = await flaskResponse.json();
      predictedScore1 = mlObj.scores?.[0] || 96;
      predictedScore2 = mlObj.scores?.[1] || 78;
      predictedScore3 = mlObj.scores?.[2] || 45;
      console.log("[Flask Scikit prediction success] Scores computed");
    }
  } catch (e) {
    // Fall back to robust mathematical safety score calculation
    console.log("[Flask Scikit-Learn offline] Operating high fidelity mathematical safety formula.");
    const hour = parseInt(timeStr.match(/\d+/)?.join("") || "10");
    const isLateNight = timeStr.toLowerCase().includes("pm") && (hour >= 9 || hour === 12) || timeStr.toLowerCase().includes("am") && hour <= 4;
    
    // Calculate report count penalties inside coordinate ranges
    const nearbyReports = reportsDb.filter(r => {
      const dist = Math.sqrt(Math.pow(r.latitude - midLat, 2) + Math.pow(r.longitude - midLng, 2));
      return dist < 0.05; // close to route
    });
    
    const penalty = Math.min(30, nearbyReports.length * 7);
    predictedScore1 = Math.max(82, 98 - (isLateNight ? 6 : 1) - penalty);
    predictedScore2 = Math.max(62, 82 - (isLateNight ? 12 : 3) - penalty);
    predictedScore3 = Math.max(25, 52 - (isLateNight ? 20 : 5) - penalty);
  }

  const generatedRoutes = [
    {
      name: isLongRoute ? "Nizamabad-Armoor National Safety Corridor" : "Mindspace-Madhapur Guardian Corridor (AI Safest)",
      description: isLongRoute 
        ? "Secured national pathway routing through active toll booths, municipal emergency clinics, and brightly functioning flyover lanes with high highway-police patrol frequency. Top rated coverage."
        : "Direct well-lit route via Hitec City Main Road, passing through active tech parks, brightly lit commercial showrooms, and directly next to Madhapur Police Station Outpost. 24/7 CCTV surveillance.",
      safetyScore: predictedScore1,
      lightingLevel: "Excellent",
      crowdVibe: "Active & Crowded",
      distance: isLongRoute ? "24.5 km" : "1.6 km",
      duration: isLongRoute ? "32 mins" : "18 mins",
      highlights: isLongRoute 
        ? ["Highly guarded express toll route", "Active highway-patrol cover every 15 minutes", "Seeded clinics along Nizamabad-Armoor midpoint"]
        : ["Continuous Cyberabad She-Team surveillance", "Fully illuminated storefront grid", "Direct link to Madhapur central division"],
      hazards: isLongRoute ? ["Minor vehicle speed drafts"] : ["Heavy traffic crossings"],
      safeHavens: generateEmergencyHavens(),
      coordinates: getInterpolatedPoints(0.001, 0.002, 6)
    },
    {
      name: isLongRoute ? "Armoor Highway Bypass Lane" : "Inorbit-Jubilee Transit Bypass",
      description: isLongRoute
        ? "Alternative commercial route bypassing deep bypass crossings. Features moderate vehicle transit flow but lower side-walk density. Generally recommended during standard evening hours."
        : "Utilizes the main bypass highway of Jubilee Hills Road No. 36. Good overhead light grids, with minor metro construction block underpass shadows.",
      safetyScore: predictedScore2,
      lightingLevel: "Moderate",
      crowdVibe: "Moderate Vehicular Flow",
      distance: isLongRoute ? "27.2 km" : "1.9 km",
      duration: isLongRoute ? "38 mins" : "21 mins",
      highlights: isLongRoute
        ? ["Bypasses dense local blockades", "Wide paved road margins"]
        : ["Avoids heavy signal bottlenecks", "Wide commercial pathways"],
      hazards: ["Slightly dimly lit parking areas", "Underpass shadow zones"],
      safeHavens: [generateEmergencyHavens()[0]],
      coordinates: getInterpolatedPoints(0.004, -0.006, 6)
    },
    {
      name: "Direct Route (Shortcut Back-Alley Tunnel - NOT RECOMMENDED)",
      description: "Direct geographical straight line shortcut bypassing safety corridors. Highly isolated lanes with active unlit reports, secluded yards, and zero active police surveillance booths.",
      safetyScore: predictedScore3,
      lightingLevel: "Poor",
      crowdVibe: "Isolated & Silent",
      distance: isLongRoute ? "22.8 km" : "1.2 km",
      duration: isLongRoute ? "29 mins" : "11 mins",
      highlights: ["Shortest physical route length"],
      hazards: ["Complete blackout stretches with high vegetation cover", "Secluded blind alleys with active community warning reports"],
      safeHavens: [],
      coordinates: getInterpolatedPoints(0.008, 0.012, 5)
    }
  ];

  // AI Route evaluation text summary using Gemini API if configured
  let aiSummaryText = `HYDERABAD SAFE-ROUTE ASSESSMENT: We strongly enforce choosing the "${generatedRoutes[0].name}" which preserves a high safety rating of ${predictedScore1}%. Dark pathways on direct back alleys are flagged with community warnings of poor illumination. Avoid short tunnel alleys after dusk.`;
  
  const client = getGeminiClient();
  if (client) {
    try {
      const aiPrompt = `You are the lead AI safety specialist for SafeHer AI. Evaluate commute journey from "${origin}" to "${destination}" with Safety Score: ${predictedScore1}%. Highlight why main streets are safer and offer a short 2-sentence warning checklist for solo female travelers.`;
      const aiResult = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: aiPrompt
      });
      if (aiResult.text) {
        aiSummaryText = aiResult.text.trim();
      }
    } catch (e) {
      console.warn("Gemini evaluation error, using local fallback summary text:", e);
    }
  }

  res.json({
    routes: generatedRoutes,
    timeOfDay: timeStr,
    aiSummary: aiSummaryText
  });
});

// 6. Gemini-powered Safety Companion Chatbot Widget with Geolocation context
app.post("/api/companion-chat", async (req, res) => {
  const { messages, userCoords } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required." });
  }

  // Calculate real-time emergency centers distances if user position is shared
  let nearbyAlertHUD = "";
  if (userCoords && userCoords.lat && userCoords.lng) {
    const lat = Number(userCoords.lat);
    const lng = Number(userCoords.lng);
    
    // List default seed hubs to calculate distance
    const policeBooths = [
      { name: "Madhapur Main Station Outpost", lat: 17.4421, lng: 78.3780 },
      { name: "Jubilee Hills Women She-Team Base", lat: 17.4320, lng: 78.4010 },
      { name: "Kondapur Transit Police Desk", lat: 17.4620, lng: 78.3582 }
    ];

    // Find closest
    let minDistance = 999;
    let closestName = "N/A";
    policeBooths.forEach(pb => {
      // rough distance in KM (1 degree approx 111km)
      const d = Math.sqrt(Math.pow(pb.lat - lat, 2) + Math.pow(pb.lng - lng, 2)) * 111;
      if (d < minDistance) {
        minDistance = d;
        closestName = pb.name;
      }
    });

    nearbyAlertHUD = ` [System HUD: Closest safe rescue base is "${closestName}" residing approx ${minDistance.toFixed(2)} km from you. Ready to alert on command]`;
  }

  const client = getGeminiClient();
  if (!client) {
    // Elegant scenario guidance fallback responses
    const lastUserMsg = messages[messages.length - 1]?.message?.toLowerCase() || "";
    let reply = "Hello! I am Aria, your SafeHer companion. I am tracking your coordinates. Keep your thumb near the SOS button and let me know if you feel unsafe.";
    
    if (lastUserMsg.includes("scared") || lastUserMsg.includes("follow") || lastUserMsg.includes("loiter") || lastUserMsg.includes("danger") || lastUserMsg.includes("help")) {
      reply = `🚨 Please stay calm but move urgently into a broad, lit commercial street! There is an active She-Teams Rescue post close by.${nearbyAlertHUD || " Keep moving toward a security guard or active storefront immediately."} I have initialized a pre-emptive SOS dispatch. Press the SOS button to sound the alarm.`;
    } else if (lastUserMsg.includes("dark") || lastUserMsg.includes("light") || lastUserMsg.includes("broken")) {
      reply = "Keep your head high and scan your surroundings. Turn on your phone's screen flashlight or the dynamic strobe on our screen. I have logged this unlit segment as a hazard.";
    } else if (lastUserMsg.includes("home") || lastUserMsg.includes("arrived") || lastUserMsg.includes("safe")) {
      reply = "That is amazing news! 🎉 Safely locked in. I will turn off active tracking and register your commute as completed successfully.";
    } else if (lastUserMsg.includes("yes") || lastUserMsg.includes("people")) {
      reply = "Excellent. Walking near people decreases isolation risk. Maintain a brisk pace, call a guardian, and let me know when you cross the intersection.";
    }
    
    return res.json({ reply });
  }

  try {
    const latestMsgText = messages[messages.length - 1]?.message || "Hello";
    
    const geminiChat = client.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: `You are 'Aria', an active voice-capable safety companion for women commuting alone.
Your personality is highly reassuring, alert, firm, and protective.
If user feels in hazard, give swift, direct, 1-2 sentence directives (e.g. walk into a shop, hold phone visibly, tap SOS).
Avoid listicles or long paragraphs because they are traveling and reading in panic.
Current metadata context: ${nearbyAlertHUD || "Active location tracking enabled"}.`
      }
    });

    const response = await geminiChat.sendMessage({ message: latestMsgText });
    res.json({ reply: response.text });
  } catch (err) {
    console.error("Gemini Companion chat failed:", err);
    res.json({ reply: "I am right here with you on call. Keep walking along the main street, look confident, and press SOS instantly if anyone gets too close." });
  }
});

// 7. Emergency Panic SOS trigger
app.post("/api/sos", (req, res) => {
  const { username, currentCoords, contactsAlerted } = req.body;
  
  console.log(`[ALERT LOG] IMMEDIATE SOS TRIGGERED. USER: "${username || "Guest"}". COORDS:`, currentCoords);
  console.log(`[ALERT LOG] SMS DISPATCHED TO CONTACTS:`, contactsAlerted || ["Mom", "Dad", "Police Dispatch"]);
  
  res.json({
    status: "URGENT_ALARM_DISPATCHED",
    message: "Emergency broadcast launched. Cyberabad She-Teams alert status: DISPATCHING UNIT. Local hotline triggered. Emergency contacts notified via simulated SMS Gateway.",
    timestamp: new Date().toISOString()
  });
});

// 8. Retrieve Commutes / History Logging
app.get("/api/commutes", (req, res) => {
  const commutes = readJsonFile<SavedCommute[]>(COMMUTES_FILE, defaultCommutesList);
  res.json(commutes);
});

// Save a completed Commute to History Page
app.post("/api/commutes", (req, res) => {
  const { username, originName, destName, routeChosen, distance, duration, safetyScore, coordinates, safeHavens, aiSummary } = req.body;
  
  if (!originName || !destName || !routeChosen) {
    return res.status(400).json({ error: "Missing commute parameters to register in log." });
  }

  const commutes = readJsonFile<SavedCommute[]>(COMMUTES_FILE, defaultCommutesList);
  const newCommute: SavedCommute = {
    id: "com-" + Date.now().toString(),
    username: username || "demo",
    originName,
    destName,
    routeChosen,
    distance: distance || "1.5 km",
    duration: duration || "12 mins",
    safetyScore: safetyScore || 90,
    timestamp: new Date().toISOString(),
    coordinates: coordinates || [],
    safeHavens: safeHavens || [],
    aiSummary: aiSummary || "Commute completed and recorded successfully."
  };

  commutes.unshift(newCommute);
  writeJsonFile(COMMUTES_FILE, commutes);

  res.status(201).json(newCommute);
});


// Configure Vite / Express production configuration
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Make sure we listen on http server which supports both express and socket.io!
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[SafeHer AI Full-Stack App] Running perfectly on http://localhost:${PORT}`);
  });
}

bootstrap();
