import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldAlert, 
  MapPin, 
  Eye, 
  Navigation, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  PlusCircle, 
  HelpCircle, 
  Compass, 
  Activity, 
  ThumbsUp, 
  X, 
  Info, 
  Volume2, 
  PhoneCall, 
  Lock, 
  ShieldCheck, 
  Clock, 
  Users, 
  ListOrdered,
  AlertOctagon,
  LogOut,
  Map,
  Moon,
  Sun,
  User,
  Zap,
  Mic,
  MicOff,
  History as HistoryIcon,
  Home as HomeIcon,
  HelpCircle as HelpIcon,
  Settings
} from "lucide-react";
import { io } from "socket.io-client";
import AestheticMap from "./components/AestheticMap";
import RoutePlanner from "./components/RoutePlanner";
import LoginPage from "./components/LoginPage";
import ChatbotWidget from "./components/ChatbotWidget";
import { SafetyRoute, SafetyReport, ChatMessage, SessionContact, Coord } from "./types";

export default function App() {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("safeher_logged_in") === "true";
  });
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("safeher_user_profile");
      return saved ? JSON.parse(saved) : { name: "Pranavi Rao", email: "pranavi.rao@gmail.com" };
    } catch (e) {
      return { name: "Pranavi Rao", email: "pranavi.rao@gmail.com" };
    }
  });

  const handleLogin = (name: string, email: string, token: string) => {
    const userObj = { name, email };
    setCurrentUser(userObj);
    setIsLoggedIn(true);
    localStorage.setItem("safeher_logged_in", "true");
    localStorage.setItem("safeher_user_profile", JSON.stringify(userObj));
    localStorage.setItem("safeher_jwt_token", token);
    
    // Voice welcome greeting
    setTimeout(() => {
      try {
        speakText(`Welcome back to SafeHer AI, ${name.split(" ")[0]}. Your protective safety matrix has been successfully initialized.`);
      } catch (e) {}
    }, 400);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("safeher_logged_in");
    localStorage.removeItem("safeher_user_profile");
    localStorage.removeItem("safeher_jwt_token");
  };

  // Nav Switcher: landing, dashboard, history, profile
  const [activeTab, setActiveTab] = useState<"landing" | "dashboard" | "history" | "profile">("landing");
  const [devMode, setDevMode] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("safeher_theme") === "dark";
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("safeher_theme", isDarkMode ? "dark" : "light");
    } catch (e) {}
  }, [isDarkMode]);

  // Core safety & mapping state
  const [routes, setRoutes] = useState<SafetyRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<SafetyRoute | null>(null);
  const [aiSummary, setAiSummary] = useState("");
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [reports, setReports] = useState<SafetyReport[]>([]);
  
  // Geolocation Precision autodetect
  const [geoStatus, setGeoStatus] = useState<"detecting" | "gps" | "ip" | "denied">("detecting");
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [detectedCity, setDetectedCity] = useState("Hyderabad, IN");

  // Simulation & Deviation States
  const [isSimulating, setIsSimulating] = useState(false);
  const [userPos, setUserPos] = useState<Coord | null>(null);
  const [currentCoordIndex, setCurrentCoordIndex] = useState(0);
  const [isDeviated, setIsDeviated] = useState(false);
  const [showDeviationPrompt, setShowDeviationPrompt] = useState(false);
  const [simStatusLogs, setSimStatusLogs] = useState<string[]>([
    "Safety trackers calibrated. Waiting for journey launch..."
  ]);

  // Voice SOS Triggers
  const [isVoiceSOSListening, setIsVoiceSOSListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Emergency overlay and SMS simulated logging
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [sosStatusMessage, setSosStatusMessage] = useState("");
  const [contactsAlerted, setContactsAlerted] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("safeher_emergency_contacts");
      return saved ? JSON.parse(saved) : [
        "Mom (Sunitha Rao) - +91 98480 22338",
        "Sister (Anvitha Rao) - +91 98480 33449",
        "Cyberabad Police Dispatch Units - 100"
      ];
    } catch (e) {
      return [
        "Mom (Sunitha Rao) - +91 98480 22338",
        "Sister (Anvitha Rao) - +91 98480 33449",
        "Cyberabad Police Dispatch Units - 100"
      ];
    }
  });

  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("safeher_emergency_contacts", JSON.stringify(contactsAlerted));
    } catch (e) {}
  }, [contactsAlerted]);

  const handleAddContact = () => {
    if (!newContactName.trim()) return;
    const phone = newContactPhone.trim();
    const item = `${newContactName.trim()}${phone ? ' - ' + phone : ''}`;
    setContactsAlerted(prev => [...prev, item]);
    setNewContactName("");
    setNewContactPhone("");
    try {
      speakText(`Added ${newContactName} to your emergency alert ring.`);
    } catch (e) {}
  };

  const handleRemoveContact = (index: number) => {
    setContactsAlerted(prev => prev.filter((_, i) => i !== index));
    try {
      speakText(`Removed contact details.`);
    } catch (e) {}
  };

  // Completed Commutes History list
  const [pastCommutes, setPastCommutes] = useState<any[]>([]);
  const [selectedPastCommute, setSelectedPastCommute] = useState<any>(null);

  // Strobe safety lights state
  const [isStrobeOn, setIsStrobeOn] = useState(false);

  // Incident crowdsourced reporting fields
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("poor_lighting");
  const [reportTitle, setReportTitle] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportSeverity, setReportSeverity] = useState<"Low" | "Medium" | "High">("Medium");
  const [reportLat, setReportLat] = useState(17.4436);
  const [reportLng, setReportLng] = useState(78.3772);

  // Aria safety companion chat list
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "model",
      message: "Hello! I am Aria, your SafeHer companion. Keep walking confidently. Let me know if you feel uncomfortable or see unlit sectors.",
      timestamp: new Date()
    }
  ]);

  // Clock tick
  const [tickTime, setTickTime] = useState("");
  useEffect(() => {
    const interval = setInterval(() => {
      setTickTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Socket.io initialization
  useEffect(() => {
    const socket = io(); // Connects to Express container port dynamically

    socket.on("connect", () => {
      console.log("[SocketIO Connected] Linked to the unified Express network");
    });

    socket.on("new-report", (newRep: SafetyReport) => {
      setReports(prev => {
        if (prev.find(r => r.id === newRep.id)) return prev;
        return [newRep, ...prev];
      });
      speakText(`Grid alert: New crowdsourced safety incident reported: ${newRep.title}`);
    });

    socket.on("report-updated", (updRep: SafetyReport) => {
      setReports(prev => prev.map(r => r.id === updRep.id ? updRep : r));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Smart Geolocation Autodetect on Mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setDetectedCoords({ lat, lng });
          setGeoStatus("gps");
          setUserPos({ x: lat, y: lng });
          setReportLat(lat);
          setReportLng(lng);
        },
        (err) => {
          console.warn("GPS request rejected. Querying IP Geolocation API fallback.");
          fallbackToIp();
        },
        { enableHighAccuracy: true, timeout: 4500 }
      );
    } else {
      fallbackToIp();
    }
  }, []);

  const fallbackToIp = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      if (res.ok) {
        const data = await res.json();
        const lat = data.latitude || 17.4483;
        const lng = data.longitude || 78.3741;
        setDetectedCoords({ lat, lng });
        setDetectedCity(`${data.city || "Hyderabad"}, ${data.region_code || "TS"}`);
        setGeoStatus("ip");
        setUserPos({ x: lat, y: lng });
        setReportLat(lat);
        setReportLng(lng);
      } else {
        throw new Error("Ipapi query failed");
      }
    } catch (e) {
      setGeoStatus("denied");
      setDetectedCoords({ lat: 17.4483, lng: 78.3741 }); // Hyderabad center default
      setDetectedCity("Hyderabad, TS (Fallback)");
      setUserPos({ x: 17.4483, y: 78.3741 });
    }
  };

  // Safe parse JSON utility
  const safeParseJson = async (response: Response) => {
    const rawText = await response.text();
    try {
      if (!rawText) return { error: "Empty server payload" };
      return JSON.parse(rawText);
    } catch (e) {
      console.warn("Raw API answer was not valid JSON, using fallbacks:", rawText);
      return { error: "Format error", raw: rawText };
    }
  };

  // Fetch Safety Reports & History lists
  useEffect(() => {
    if (isLoggedIn) {
      fetchReports();
      fetchCommutesHistory();
    }
  }, [isLoggedIn]);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await safeParseJson(res);
        if (Array.isArray(data)) {
          setReports(data);
        }
      }
    } catch (e) {
      console.error("Failed to read reports list:", e);
    }
  };

  const fetchCommutesHistory = async () => {
    try {
      const res = await fetch("/api/commutes");
      if (res.ok) {
        const data = await safeParseJson(res);
        if (Array.isArray(data)) {
          setPastCommutes(data);
        }
      }
    } catch (e) {
      console.error("Failed to read history commutes:", e);
    }
  };

  // Voice Speech synthesizer (DISABLED/MUTED PER USER REQUEST to remove voice assistance)
  const speakText = (text: string) => {
    // Voice assistance completely deactivated to respect user choice.
    console.log("[Muted Voice Escort]:", text);
  };

  // True browser-native precision live GPS tracking updater
  const triggerGPSRecalibration = () => {
    if (!navigator.geolocation) {
      alert("Pinging GPS Failed: Your browser does not support geolocation APIs.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setDetectedCoords({ lat, lng });
        setGeoStatus("gps");
        setUserPos({ x: lat, y: lng });
        setReportLat(lat);
        setReportLng(lng);
        setDetectedCity("Accurate Live GPS Tracker Node");
        setGpsLoading(false);
        setSimStatusLogs(prev => [
          `[GPS Recalibrated]: Position successfully synced to lat ${lat.toFixed(6)}, lng ${lng.toFixed(6)}`,
          ...prev
        ]);
      },
      (err) => {
        console.warn("Manual GPS query failed, using offline fallback address network:", err);
        setGpsLoading(false);
        alert("GPS Recalibration failed. Please authorize location permissions in your browser bar.");
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  // Search routes safety analysis
  const handleRouteSearch = async (originText: string, destText: string, selectedTime: string) => {
    setIsLoadingRoutes(true);
    setSelectedRoute(null);
    setIsSimulating(false);
    setUserPos(null);
    setIsDeviated(false);

    try {
      const res = await fetch("/api/route-safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: originText,
          destination: destText,
          timeOfDay: selectedTime,
          originCoords: detectedCoords
        })
      });

      const data = await safeParseJson(res);
      if (res.ok && data.routes) {
        setRoutes(data.routes);
        setSelectedRoute(data.routes[0]);
        setAiSummary(data.aiSummary || "");
        
        // Center user to starting point of the routes
        if (data.routes[0].coordinates.length > 0) {
          const startPt = data.routes[0].coordinates[0];
          setUserPos({ x: startPt.x, y: startPt.y });
        }
        speakText(`Analysis complete. Found ${data.routes.length} matching routes. Highest safety rating is ${data.routes[0].safetyScore} percent.`);
      } else {
        throw new Error(data.error || "Route safety search failed");
      }
    } catch (e: any) {
      console.error("API Search failed:", e);
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  // Handle double clicking map to configure report latitude/longitude
  const handleMapSelection = (coords: Coord) => {
    setReportLat(coords.x);
    setReportLng(coords.y);
    setShowReportModal(true);
  };

  // Post crowdsourced safety reports
  const handlePostReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim() || !reportDescription.trim()) return;

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: reportType,
          title: reportTitle.trim(),
          description: reportDescription.trim(),
          latitude: reportLat,
          longitude: reportLng,
          reportedBy: currentUser.name || "Solo Traveler",
          severity: reportSeverity
        })
      });

      const data = await safeParseJson(res);
      if (res.ok && data.id) {
        setReports(prev => [data, ...prev]);
        setShowReportModal(false);
        setReportTitle("");
        setReportDescription("");
        speakText("Crowdsourced safety alert published to community grid.");
      }
    } catch (err) {
      console.error("Failed submitting report pin:", err);
    }
  };

  const handleUpvoteReport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/reports/${id}/upvote`, { method: "POST" });
      const data = await safeParseJson(res);
      if (res.ok && data.id) {
        setReports(prev => prev.map(r => r.id === id ? data : r));
      }
    } catch (e) {
      console.error("Failed voting alert:", e);
    }
  };

  // AI safety chatbot sender
  const handleAriaSendMessage = async (userText: string) => {
    try {
      // Retain simple chat history
      const prevMsgs = chatMessages.map(m => ({ role: m.role, message: m.message }));
      const response = await fetch("/api/companion-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...prevMsgs, { role: "user", message: userText }],
          userCoords: userPos
        })
      });

      const data = await safeParseJson(response);
      const reply = data.reply || "I am right here guarding you. Hold your phone visible.";
      
      // Speak the reply aloud!
      speakText(reply);

      return reply;
    } catch (e) {
      return "Stay bright and keep heading toward commercial nodes. Toggling strobe lights for high visibility.";
    }
  };

  // Auto-Walking simulation timers
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startJourneySimulation = () => {
    if (!selectedRoute || selectedRoute.coordinates.length < 2) return;
    
    // Reset previous simulation parameters
    setIsSimulating(true);
    setCurrentCoordIndex(0);
    setIsDeviated(false);
    setShowDeviationPrompt(false);
    
    const startPt = selectedRoute.coordinates[0];
    setUserPos({ x: startPt.x, y: startPt.y });
    
    setSimStatusLogs([
      "🟢 Dynamic tracking initialized.",
      `Route selected: ${selectedRoute.name}`,
      `Safety evaluation is ${selectedRoute.safetyScore}% perfect.`
    ]);

    speakText("Journeys simulation active. Escort monitor calibrated.");
  };

  // Effect driving the step-by-step auto-walking nodes
  useEffect(() => {
    if (isSimulating && selectedRoute && !isDeviated && !showDeviationPrompt) {
      simTimerRef.current = setTimeout(() => {
        const nextIndex = currentCoordIndex + 1;
        const totalNodes = selectedRoute.coordinates.length;

        if (nextIndex < totalNodes) {
          setCurrentCoordIndex(nextIndex);
          const nextCoord = selectedRoute.coordinates[nextIndex];
          setUserPos({ x: nextCoord.x, y: nextCoord.y });

          // Seed dynamic progress log triggers
          const randomTriggers = [
            "Entering well-illuminated commercial corridor.",
            "Active municipal surveillance hub nearby.",
            "Solo transit safe-zone verified.",
            "Approaching community guard division outpost.",
            "Nearby medical hotline responsive."
          ];
          const chosenLog = randomTriggers[nextIndex % randomTriggers.length];
          setSimStatusLogs(prev => [`📍 Node (${nextCoord.x}, ${nextCoord.y}): ${chosenLog}`, ...prev]);
        } else {
          // Journey completed!
          setIsSimulating(false);
          speakText("Congratulations! You have successfully arrived at your secure destination checkpoint.");
          
          setSimStatusLogs(prev => ["🏁 DESTINATION ARRIVED. Journey completed successfully under guard.", ...prev]);
          
          // Submit completed commute log to backend
          saveCompletedCommute();
        }
      }, 1500); // 1.5 seconds per node step
    }

    return () => {
      if (simTimerRef.current) {
        clearTimeout(simTimerRef.current);
      }
    };
  }, [isSimulating, currentCoordIndex, selectedRoute, isDeviated, showDeviationPrompt]);

  const saveCompletedCommute = async () => {
    if (!selectedRoute) return;
    try {
      const res = await fetch("/api/commutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUser.username || "demo",
          originName: selectedRoute.name.includes("Nizamabad") ? "Nizamabad Bus Stand" : "Madhapur Metro Hub",
          destName: selectedRoute.name.includes("Armoor") ? "Armoor Junction" : "Gachibowli DLF Phase 2",
          routeChosen: selectedRoute.name,
          distance: selectedRoute.distance,
          duration: selectedRoute.duration,
          safetyScore: selectedRoute.safetyScore,
          coordinates: selectedRoute.coordinates,
          safeHavens: selectedRoute.safeHavens,
          aiSummary: aiSummary
        })
      });

      if (res.ok) {
        fetchCommutesHistory(); // update list
      }
    } catch (e) {
      console.warn("Could not sync commute to persistent log:", e);
    }
  };

  // Simulating deviation toggler
  const handleSimulateDeviation = () => {
    if (!isSimulating) return;
    
    // Toggle deviation alerts
    const nextDeviated = !isDeviated;
    setIsDeviated(nextDeviated);
    
    if (nextDeviated) {
      setShowDeviationPrompt(true);
      speakText("Warning: Immediate safety check. Route deviation detected. Please confirm your safety status.");
      setSimStatusLogs(prev => ["🚨 WARNING: GPS DEVIATION DETECTED! Pausing movement.", ...prev]);
    } else {
      setShowDeviationPrompt(false);
      setSimStatusLogs(prev => ["💚 Path deviation resolved. Resuming automated tracking.", ...prev]);
    }
  };

  const handleConfirmSafety = () => {
    setShowDeviationPrompt(false);
    setIsDeviated(false);
    speakText("Safety confirmed. Tracking resumed.");
  };

  // Emergency Panic trigger SOS
  const triggerImmediateSOS = async () => {
    setIsSOSActive(true);
    setSosStatusMessage("Connecting with She-Teams dispatcher...");
    speakText("SOS active. Alerting all emergency contacts and police hotline. Retaining raw audio streams.");
    
    try {
      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUser.username || "demo",
          currentCoords: userPos || detectedCoords,
          contactsAlerted: contactsAlerted
        })
      });

      const data = await safeParseJson(res);
      if (res.ok) {
        setSosStatusMessage(data.message || "Dispatch alert launched. Help is on the way.");
      }
    } catch (e) {
      setSosStatusMessage("Local simulated SMS triggered. Emergency sirens sounding.");
    }
  };

  const cancelSOS = () => {
    setIsSOSActive(false);
    speakText("SOS disabled. Grid back to normal secure mode.");
  };

  // Voice SOS dynamic mic enrollment trigger
  const handleVoiceSOSClick = () => {
    if (isVoiceSOSListening) {
      stopVoiceSOSListening();
    } else {
      startVoiceSOSListening();
    }
  };

  const startVoiceSOSListening = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        speakText("Microphone audio keyword recognition is not supported in this browser instance.");
        return;
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.lang = "en-US";
      rec.interimResults = false;

      rec.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
        console.log("Voice SOS recognized words:", transcript);
        if (transcript.includes("help") || transcript.includes("sos") || transcript.includes("save")) {
          triggerImmediateSOS();
        }
      };

      rec.onerror = (e: any) => {
        console.error("Mic auth error or timed out:", e);
        setIsVoiceSOSListening(false);
        speakText("Microphone authorization check failed. Please click Simulate SOS manually.");
      };

      rec.onend = () => {
        if (isVoiceSOSListening) {
          rec.start();
        }
      };

      recognitionRef.current = rec;
      rec.start();
      setIsVoiceSOSListening(true);
      speakText("Voice SOS activated. Microphone is now listening for the keyword HELP.");
    } catch (err) {
      console.error("Speech recognition fatal setup error:", err);
      setIsVoiceSOSListening(false);
    }
  };

  const stopVoiceSOSListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsVoiceSOSListening(false);
    speakText("Voice listening stands down.");
  };

  // Display Past Commute on Map layer
  const handleReviewPastCommute = (commute: any) => {
    setSelectedPastCommute(commute);
    
    // convert coordinates array
    const mappedRoute: SafetyRoute = {
      name: commute.routeChosen,
      description: commute.aiSummary,
      safetyScore: commute.safetyScore,
      lightingLevel: "Excellent",
      crowdVibe: "Historical Commute Log",
      distance: commute.distance,
      duration: commute.duration,
      highlights: [commute.routeChosen],
      hazards: [],
      safeHavens: commute.safeHavens || [],
      coordinates: commute.coordinates
    };

    setSelectedRoute(mappedRoute);
    setAiSummary(commute.aiSummary);
    setRoutes([mappedRoute]);
    
    if (commute.coordinates.length > 0) {
      const p = commute.coordinates[0];
      setUserPos({ x: p.x, y: p.y });
    }

    setActiveTab("dashboard");
    speakText(`Loading commute history route: ${commute.routeChosen}.`);
  };

  // Toggle Strobe safety flashlight
  useEffect(() => {
    let flag = false;
    let timer: NodeJS.Timeout;
    if (isStrobeOn) {
      timer = setInterval(() => {
        const body = document.getElementById("entire-app-canvas");
        if (body) {
          flag = !flag;
          body.style.background = flag ? "#3b0764" : "#020617";
        }
      }, 150);
    } else {
      const body = document.getElementById("entire-app-canvas");
      if (body) body.style.background = "";
    }

    return () => clearInterval(timer);
  }, [isStrobeOn]);


  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div 
      id="entire-app-canvas"
      className={`min-h-screen ${isDarkMode ? 'bg-[#0f172a] text-slate-100' : 'bg-[#f8fafc] text-slate-800'} flex flex-col font-sans transition-all duration-300 relative selection:bg-fuchsia-100 selection:text-slate-900`}
    >
      
      {/* 🚨 Emergency SOS Pulsing Red Overlay */}
      {isSOSActive && (
        <div className="fixed inset-0 bg-rose-950/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-6 text-center animate-pulse">
          <div className="w-24 h-24 rounded-full bg-rose-600 flex items-center justify-center text-white border-4 border-white/20 shadow-2xl mb-6">
            <AlertOctagon className="w-12 h-12 animate-bounce" />
          </div>

          <h2 className="text-3xl font-black text-white tracking-tight uppercase">EMERGENCY SOS DISPATCHED</h2>
          <p className="text-sm text-rose-350 max-w-md mx-auto mt-2 leading-relaxed">
            {sosStatusMessage || "Calling She-Teams sirens and dispatching nearest defense vehicle."}
          </p>

          <div className="mt-8 p-4 rounded-2xl bg-black/40 border border-rose-900/40 max-w-sm w-full text-left">
            <h4 className="text-xs font-mono font-bold text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Contacts Triggered
            </h4>
            <ul className="text-xs space-y-1.5 text-rose-200">
              {contactsAlerted.map((contact, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {contact} (SMS SENT)
                </li>
              ))}
            </ul>
          </div>

          <button
            id="btn-cancel-sos"
            onClick={cancelSOS}
            className="mt-10 px-8 py-3 rounded-full bg-black hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-slate-350 font-bold text-xs uppercase tracking-widest transition-all shadow-xl cursor-pointer"
          >
            Cancel Active SOS Alert
          </button>
        </div>
      )}

      {/* ⚠️ Route Deviation Alert prompt */}
      {showDeviationPrompt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 bg-white border border-rose-200 rounded-3xl shadow-2xl flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 mt-2 flex items-center justify-center text-rose-600 animate-bounce mb-4">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>

            <h3 className="text-lg font-extrabold text-slate-800">ROUTE DEVIATION DETECTED</h3>
            <p className="text-xs text-slate-500 leading-relaxed mt-1.5">
              You've drifted from the secure commute corridor! Please check in with us to guarantee your safety.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-6 w-full">
              <button 
                onClick={handleConfirmSafety}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer transition-all"
              >
                Yes, I Am Safe
              </button>

              <button 
                onClick={triggerImmediateSOS}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer transition-all animate-pulse"
              >
                Trigger SOS Alarm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header bar with custom vector logo */}
      <header className={`border-b ${isDarkMode ? 'border-slate-800 bg-slate-900/95 text-slate-100' : 'border-slate-200 bg-white/95 text-slate-800'} px-4 py-3 sticky top-0 z-30 flex items-center justify-between shadow-sm transition-colors duration-300`}>
        
        {/* Logo Shield + Female Silhouette profile */}
        <div className="flex items-center gap-2">
          {/* Custom vector logo combining shield with feminine profile */}
          <div className={`w-9 h-9 rounded-xl ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} border flex items-center justify-center text-violet-600 relative p-0.5`}>
            <svg 
              className="w-full h-full text-violet-500" 
              viewBox="0 0 40 40" 
              fill="currentColor"
            >
              {/* Glossy shield profile path */}
              <path d="M20 4c7 0 13 3 13 11c0 8-10 17-13 21c-3-4-13-13-13-21c0-8 6-11 13-11z" fill="rgba(139, 92, 246, 0.08)" stroke="currentColor" strokeWidth="1.5" />
              {/* Feminine silhouette avatar path scaled */}
              <circle cx="20" cy="14" r="3.5" fill="currentColor" />
              <path d="M14 24c0-3.5 3-5 6-5s6 1.5 6 5c0 1 0 3-4 3H18c-4 0-4-2-4-3z" fill="currentColor" />
            </svg>
            <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
          </div>

          <div className="text-left flex flex-col">
            <span className={`text-xs font-black tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-800'} uppercase leading-none`}>
              SafeHer <span className="text-fuchsia-500">AI</span>
            </span>
            <span className={`text-[8px] font-mono ${isDarkMode ? 'text-slate-450' : 'text-slate-400'} uppercase mt-0.5 tracking-wider hidden sm:inline`}>
              Commute Safety Guardian
            </span>
          </div>
        </div>

        {/* Global Dynamic GPS IP Precision badge and GPS control */}
        <div className="flex items-center gap-4">
          
          {/* Live Geolocation Tracker manual trigger button */}
          <button
            onClick={triggerGPSRecalibration}
            disabled={gpsLoading}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-[10px] font-bold uppercase transition-all shadow-sm active:scale-95 cursor-pointer ${
              isDarkMode 
                ? 'bg-violet-950/40 border-violet-900/60 text-violet-300 hover:bg-violet-900/60' 
                : 'bg-violet-50 border-violet-100 text-violet-700 hover:bg-violet-100'
            }`}
          >
            <Compass className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span>{gpsLoading ? "Syncing..." : "GPS Tracker"}</span>
          </button>

          <div className="hidden md:flex items-center gap-2">
            <span className="text-[9px] font-mono text-slate-400 block text-right leading-relaxed">
              SYSTEM TIME <br/>
              <span className={`font-mono font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{tickTime || "11:24:19 PM"}</span>
            </span>

            <div className={`h-6 w-[1px] ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'} mx-1`}></div>
            
            {geoStatus === "gps" ? (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[8.5px] font-bold rounded-lg border ${
                isDarkMode ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live GPS Pin Active
              </span>
            ) : geoStatus === "ip" ? (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[8.5px] font-bold rounded-lg border ${
                isDarkMode ? 'bg-amber-950/30 border-amber-900 text-amber-450' : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                IP Fallback ({detectedCity})
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[8.5px] font-bold rounded-lg border ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-555'
              }`}>
                Tracking Offline
              </span>
            )}
          </div>

          {/* Theme switcher */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-2xl border transition-all cursor-pointer ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-amber-400' 
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-violet-600'
            }`}
            title={isDarkMode ? "Activate Light Mode" : "Activate Dark Mode"}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Quick Active user section and logout */}
          <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-2xl shadow-sm ${
            isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white font-mono font-bold text-[10px] flex items-center justify-center uppercase shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:flex flex-col">
              <span className={`text-[10px] font-bold leading-none ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{currentUser.name.split(" ")[0]}</span>
              <span className="text-[8px] font-mono text-emerald-500 leading-none mt-0.5 font-bold">Verified Shield</span>
            </div>
            
            <button
              id="btn-app-logout"
              onClick={handleLogout}
              className="ml-2 py-1 px-2 rounded bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 hover:text-rose-700 text-[8.5px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <LogOut className="w-2.5 h-2.5" />
              LOGOUT
            </button>
          </div>
        </div>

      </header>

      {/* Main navigation switcher tab rows */}
      <nav className={`px-4 py-2 border-b flex justify-center gap-1.5 transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <button
          id="tab-landing"
          onClick={() => { setActiveTab("landing"); setSelectedPastCommute(null); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "landing" 
              ? isDarkMode ? "bg-slate-800 text-violet-400 border border-slate-700 shadow-sm" : "bg-white text-violet-700 border border-violet-200 shadow-sm" 
              : isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <HomeIcon className="w-3.5 h-3.5" />
          Home Overview
        </button>

        <button
          id="tab-dashboard"
          onClick={() => { setActiveTab("dashboard"); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "dashboard" 
              ? isDarkMode ? "bg-slate-800 text-violet-400 border border-slate-700 shadow-sm" : "bg-white text-violet-700 border border-violet-200 shadow-sm" 
              : isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Map className="w-3.5 h-3.5" />
          Dashboard Sandbox
        </button>

        <button
          id="tab-history"
          onClick={() => { setActiveTab("history"); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "history" 
              ? isDarkMode ? "bg-slate-800 text-violet-400 border border-slate-700 shadow-sm" : "bg-white text-violet-700 border border-violet-200 shadow-sm" 
              : isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <HistoryIcon className="w-3.5 h-3.5" />
          Commute Logs ({pastCommutes.length})
        </button>

        <button
          id="tab-profile"
          onClick={() => { setActiveTab("profile"); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "profile" 
              ? isDarkMode ? "bg-slate-800 text-violet-400 border border-slate-700 shadow-sm" : "bg-white text-violet-700 border border-violet-200 shadow-sm" 
              : isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Profile
        </button>
      </nav>

      {/* Content wrapper */}
      <main className="flex-grow p-4 md:p-6 w-full max-w-7xl mx-auto flex flex-col justify-stretch">
        
        {/* View Section 1: Home/Landing tab */}
        {activeTab === "landing" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch my-auto">
            
            {/* Left Wing - App Overview and Banner Graphic */}
            <div className={`lg:col-span-6 border ${isDarkMode ? 'bg-slate-900/80 border-slate-800 text-slate-100 shadow-xl' : 'bg-white border-slate-200 text-slate-800 shadow-sm'} rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden min-h-[460px] transition-all`}>
              
              <div className="relative z-10 text-left">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 ${isDarkMode ? 'bg-violet-950/40 border-violet-900 text-violet-300' : 'bg-violet-50 border-violet-100 text-violet-700'} border rounded-full text-[9px] font-mono font-bold uppercase tracking-widest mb-4`}>
                  🛡️ ADVANCED SAFETY PLATFORM LIVE
                </div>

                {/* Banner Graphic related to woman safety */}
                <div className={`rounded-2xl overflow-hidden mb-6 aspect-[16/9] border ${isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'} shadow-md relative flex items-center justify-center`}>
                  {/* Subtle map coordinates or grid */}
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                  
                  {/* Glowing map network traces */}
                  <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M 40 80 Q 150 20, 240 100 T 400 60"
                      fill="none"
                      stroke="url(#neon-blue-grad)"
                      strokeWidth="3"
                      className="animate-[dash_6s_linear_infinite]"
                      strokeDasharray="8 4"
                    />
                    <path
                      d="M 50 140 Q 180 80, 290 130 T 420 90"
                      fill="none"
                      stroke="url(#neon-pink-grad)"
                      strokeWidth="2.5"
                      className="animate-[dash_8s_linear_infinite]"
                      strokeDasharray="6 3"
                    />
                    <defs>
                      <linearGradient id="neon-blue-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.1" />
                        <stop offset="50%" stopColor="#6366f1" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
                      </linearGradient>
                      <linearGradient id="neon-pink-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ec4899" stopOpacity="0.1" />
                        <stop offset="50%" stopColor="#f43f5e" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#d946ef" stopOpacity="0.2" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Intersecting Pulse Dots */}
                  <div className="absolute left-[38%] top-[25%] flex items-center justify-center">
                    <span className="absolute w-5 h-5 bg-violet-500/20 rounded-full animate-ping" />
                    <span className="w-2.5 h-2.5 bg-violet-600 rounded-full border-2 border-white shadow shadow-violet-500/50" />
                  </div>
                  <div className="absolute right-[30%] bottom-[33%] flex items-center justify-center">
                    <span className="absolute w-6 h-6 bg-rose-500/20 rounded-full animate-ping" />
                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white shadow shadow-rose-500/50" />
                  </div>

                  {/* Shield Badge Container */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg border border-violet-400">
                      <ShieldCheck className="w-9 h-9 text-white" />
                    </div>
                    <div className="text-center px-4 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl py-1">
                      <span className="text-[10px] font-mono font-bold tracking-widest text-violet-300">SHIELD DYNAMICS: SAFE</span>
                    </div>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-4.5xl font-black tracking-tight leading-none uppercase">
                  SECURE METRICS <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500">ESCORT RADAR</span>
                </h1>

                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-550'} leading-relaxed mt-4 font-medium`}>
                  SafeHer AI leverages browser high-precision tracking, real-time street level illumination maps, crowd-sourced regional danger pins, and an inline Companion chatbot to empower secure individual travel across the city nodes.
                </p>
              </div>

              {/* Status footer widgets */}
              <div className={`relative z-10 grid grid-cols-2 gap-3 pt-4 border-t ${isDarkMode ? 'border-slate-800/80' : 'border-slate-200'} mt-6`}>
                <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} border flex flex-col gap-1 text-left`}>
                  <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">DEVICE GPS STATUS</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`w-2 h-2 rounded-full ${geoStatus === 'gps' ? 'bg-emerald-500 animate-ping' : 'bg-amber-500 animate-pulse'}`}></span>
                    <span className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{geoStatus === 'gps' ? "GPS Active" : "IP Geolocation"}</span>
                  </div>
                </div>

                <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} border flex flex-col gap-1 text-left`}>
                  <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">SYSTEM CITY GATEWAY</span>
                  <div className={`text-[11px] font-bold truncate mt-1 flex items-center gap-1 ${isDarkMode ? 'text-slate-350' : 'text-slate-700'}`}>
                    <MapPin className="w-3.5 h-3.5 text-violet-501 shrink-0" />
                    {detectedCity}
                  </div>
                </div>
              </div>

            </div>

            {/* Right Wing - Comprehensive Product Specs & Woman Safety Guide */}
            <div className={`lg:col-span-6 border ${isDarkMode ? 'bg-slate-900/80 border-slate-800 text-slate-100 shadow-xl' : 'bg-white border-slate-200 text-slate-800 shadow-sm'} rounded-3xl p-6 flex flex-col justify-between min-h-[460px] transition-all`}>
              
              <div className="text-left">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-xl bg-violet-600/10 text-violet-505">
                    <ShieldCheck className="w-5 h-5 text-violet-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wide">WOMEN SAFETY SYSTEM DETAILS</h2>
                    <p className={`text-[10px] uppercase font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-450'}`}>Technical companion capability spectrum</p>
                  </div>
                </div>

                {/* Second safety related image */}
                <div className={`rounded-xl overflow-hidden mb-4 aspect-[21/9] border ${isDarkMode ? 'border-slate-800 bg-slate-950 text-slate-300' : 'border-slate-150 bg-slate-50 text-slate-800'} shadow-sm relative flex items-center justify-between px-6`}>
                  {/* Backdrop matrix layout */}
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />
                  
                  {/* Origin */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500 flex items-center justify-center relative">
                      <span className="absolute w-5 h-5 bg-emerald-500/30 rounded-full animate-ping" />
                      <MapPin className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase mt-1">Origin Node</span>
                    <span className="text-[7.5px] font-mono text-slate-500">Active Tracker</span>
                  </div>

                  {/* Horizontal Connection 1 */}
                  <div className="flex-1 border-t border-dashed border-violet-500/40 relative mx-2 h-1 flex items-center justify-center">
                    <span className="absolute w-1.5 h-1.5 rounded-full bg-violet-400 animate-[pulse_1.5s_infinite]" />
                  </div>

                  {/* Escort Node */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center border border-violet-400 relative">
                      <Activity className="w-5.5 h-5.5 text-white animate-pulse" />
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase mt-1 text-center truncate max-w-[85px]">AI Escort</span>
                    <span className="text-[7.5px] font-mono text-fuchsia-400">Live Escort Active</span>
                  </div>

                  {/* Horizontal Connection 2 */}
                  <div className="flex-1 border-t border-dashed border-fuchsia-500/40 relative mx-2 h-1 flex items-center justify-center">
                    <span className="absolute w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-[pulse_1.5s_infinite_0.5s]" />
                  </div>

                  {/* Destination */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500 flex items-center justify-center">
                      <CheckCircle className="w-4.5 h-4.5 text-violet-500" />
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase mt-1">Secured Node</span>
                    <span className="text-[7.5px] font-mono text-slate-500">Auto Dispatched</span>
                  </div>
                </div>

                {/* Spec List */}
                <div className="space-y-3.5 my-4">
                  <div className="flex items-start gap-2.5">
                    <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0 text-xs font-bold leading-none">01</span>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold font-sans">Dynamic Illuminance Routing AI</h4>
                      <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} leading-snug mt-0.5`}>
                        Processes municipal grid vectors to rank routes based on active street lighting densities, building statuses, and camera coverage.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="p-1.5 rounded-lg bg-violet-500/10 text-violet-500 shrink-0 text-xs font-bold leading-none">02</span>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold font-sans">SMS SOS Guardian Ring</h4>
                      <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} leading-snug mt-0.5`}>
                        Keeps persistent contact list to trigger silent emergency web logs or automated SMS dispatch if the traveler deviates from optimal pathways.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="p-1.5 rounded-lg bg-fuchsia-500/10 text-fuchsia-505 shrink-0 text-xs font-bold leading-none">03</span>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold font-sans">Smart Companion Chat Escort</h4>
                      <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} leading-snug mt-0.5`}>
                        Integrated conversational chatbot Aria checks transit logs, calculates safe local segments, and replies to protective security queries.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 shrink-0 text-xs font-bold leading-none">04</span>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold font-sans">Crowdsourced Blackout Logs</h4>
                      <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} leading-snug mt-0.5`}>
                        Allows fast incident recording by double-tapping geographical coordinates. Shared in real-time with surrounding active users on the grid.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action buttons */}
              <div className={`flex flex-col gap-2 mt-4 pt-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <button
                  id="btn-goto-dashboard"
                  onClick={() => setActiveTab("dashboard")}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-600 hover:opacity-95 text-white font-black text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                >
                  <Navigation className="w-4 h-4 ml-1" />
                  PROCEED TO DASHBOARD SANDBOX
                </button>
              </div>

            </div>

          </div>
        )}

        {/* View Section 2: Dashboard Space */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow items-stretch">
            
            {/* Left Control widgets columns */}
            <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-180px)] pr-1 custom-scrollbar">
              
              {/* If Selected past commute logs, show review warning banner */}
              {selectedPastCommute && (
                <div className="p-3.5 bg-violet-950/30 border border-violet-900 rounded-2xl text-left flex items-start gap-2.5">
                  <div className="p-1.5 rounded-xl bg-violet-900/40 text-violet-400 shrink-0">
                    <HistoryIcon className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[9px] font-mono text-violet-605 font-bold uppercase block">Reviewing Commute Log history</span>
                    <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                      Coordinates polyline from historic routing loaded on map. Click normal search preset to restore dynamic routing capabilities.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedPastCommute(null);
                        setRoutes([]);
                        setSelectedRoute(null);
                        setAiSummary("");
                      }}
                      className="text-[10px] font-mono text-fuchsia-600 hover:text-fuchsia-700 mt-1 font-bold block text-left underline cursor-pointer"
                    >
                      Clear Log View
                    </button>
                  </div>
                </div>
              )}

              {/* Simulation journey parameters overview if isSimulating */}
              {isSimulating && selectedRoute && (
                <div className="p-4 bg-white border border-slate-200 rounded-3xl text-left flex flex-col gap-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-fuchsia-600 uppercase tracking-widest block">Active Commuter escort simulation</span>
                      <strong className="text-slate-800 text-xs truncate max-w-[200px] block mt-0.5">{selectedRoute.name}</strong>
                    </div>
                    {/* Progress percent block */}
                    <span className="text-xs font-mono font-black text-slate-500">
                      {Math.round((currentCoordIndex / (selectedRoute.coordinates.length - 1)) * 100)}%
                    </span>
                  </div>

                  {/* Progress bar stream wrapper */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500" 
                      style={{ width: `${(currentCoordIndex / (selectedRoute.coordinates.length - 1)) * 100}%` }}
                    />
                  </div>

                  {/* Live sim feed status tickers */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-605 max-h-[85px] overflow-y-auto">
                    {simStatusLogs.map((log, idx) => (
                      <div key={idx} className="border-b border-slate-100 py-1.5 last:border-0 leading-normal">
                        {log}
                      </div>
                    ))}
                  </div>

                  {/* Interrupt triggers */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleSimulateDeviation}
                      className="py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-750 text-[10.5px] font-bold tracking-tight cursor-pointer"
                    >
                      Trigger Test Deviate
                    </button>

                    <button
                      onClick={() => {
                        setIsSimulating(false);
                        speakText("Journey tracking force stopped.");
                      }}
                      className="py-1.5 rounded-xl border border-slate-250 bg-slate-50 text-slate-600 font-bold text-[10.5px] hover:bg-slate-100 cursor-pointer"
                    >
                      Stop Tracking
                    </button>
                  </div>
                </div>
              )}

              {/* Chat tab and Route Selection tab switch parameters */}
              <div className="flex flex-col gap-4">
                
                {/* Router generator box */}
                <RoutePlanner
                  onSearch={handleRouteSearch}
                  isLoading={isLoadingRoutes}
                  routes={routes}
                  selectedRoute={selectedRoute}
                  onSelectRoute={(r) => { 
                    setSelectedRoute(r); 
                    if (r.coordinates.length > 0) setUserPos({ x: r.coordinates[0].x, y: r.coordinates[0].y }); 
                  }}
                  onStartJourney={startJourneySimulation}
                  aiSummary={aiSummary}
                />

                {/* Tactical Emergency Configuration Card */}
                <div className={`p-5 rounded-3xl border text-left ${
                  isDarkMode 
                    ? 'bg-slate-900/80 border-slate-800 text-slate-100 shadow-xl' 
                    : 'bg-white border-slate-200 text-slate-800 shadow-sm'
                }`}>
                  <h3 className="text-xs font-mono font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                    <Settings className="w-3.5 h-3.5 text-violet-500" />
                    Tactical Safety Configuration
                  </h3>

                  <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} leading-relaxed`}>
                    Configure your high-priority guardian alert circle list, toggle strobe flashing warning indicators, or dispatch immediate simulated SOS signals.
                  </p>

                  {/* Simulated Emergency contacts listing */}
                  <div className="my-4 space-y-2">
                    <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase flex justify-between items-center">
                      <span>Emergency Guardian Circle</span>
                      <span className="text-[9.5px] text-violet-500 font-bold">({contactsAlerted.length} Registered)</span>
                    </h4>
                    
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {contactsAlerted.map((c, i) => (
                        <div key={i} className={`flex items-center justify-between p-2 rounded-xl text-xs ${
                          isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-150 text-slate-700'
                        } border`}>
                          <span className="font-bold truncate pr-1">{c}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[8px] font-mono font-bold text-emerald-600 px-1.5 py-0.5 rounded bg-emerald-55 border border-emerald-100 uppercase">SMS Ready</span>
                            <button
                              onClick={() => handleRemoveContact(i)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-all cursor-pointer"
                              title="Delete Contact"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {contactsAlerted.length === 0 && (
                        <div className={`text-center py-4 border border-dashed rounded-xl text-xs ${
                          isDarkMode ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'
                        }`}>
                          No emergency contacts added. Please add at least one alert target below.
                        </div>
                      )}
                    </div>

                    {/* Add New Emergency Contact Fields */}
                    <div className={`mt-3 p-3 rounded-2xl ${isDarkMode ? 'bg-slate-950/45 border-slate-800' : 'bg-violet-50/50 border-violet-100'} border`}>
                      <span className="text-[9.5px] font-mono font-bold text-violet-500 uppercase tracking-wider block mb-2">Register Guardian Contact</span>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="text" 
                            placeholder="Name (e.g. Mom)" 
                            value={newContactName}
                            onChange={(e) => setNewContactName(e.target.value)}
                            className={`px-3 py-1.5 text-xs rounded-xl focus:border-violet-500 focus:outline-none placeholder:text-slate-400 font-medium ${
                              isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                          <input 
                            type="text" 
                            placeholder="Phone (e.g. +91 98480)" 
                            value={newContactPhone}
                            onChange={(e) => setNewContactPhone(e.target.value)}
                            className={`px-3 py-1.5 text-xs rounded-xl focus:border-violet-555 focus:outline-none placeholder:text-slate-400 font-mono ${
                              isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                        </div>
                        <button
                          onClick={(e) => { e.preventDefault(); handleAddContact(); }}
                          disabled={!newContactName.trim()}
                          className="w-full py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          Add Contact to Circle
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Warn Mode Switchers & SOS Trigger controllers */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button
                      onClick={() => setIsStrobeOn(!isStrobeOn)}
                      className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        isStrobeOn 
                          ? "bg-amber-500/15 border-amber-500 text-amber-500 shadow-md animate-pulse" 
                          : isDarkMode
                            ? "bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-400"
                            : "bg-slate-50 border-slate-250 hover:bg-slate-100/80 text-slate-750"
                      }`}
                    >
                      <Zap className={`w-5 h-5 ${isStrobeOn ? 'text-amber-500' : 'text-slate-400'}`} />
                      <span>{isStrobeOn ? "Strobe Warn ACTIVE" : "Strobe Mode OFF"}</span>
                      <span className="text-[8px] opacity-75 font-mono">Flash Warning lights</span>
                    </button>

                    <button
                      onClick={triggerImmediateSOS}
                      className="p-3 rounded-2xl border border-rose-600 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all shadow-sm"
                    >
                      <AlertOctagon className="w-5 h-5 animate-pulse" />
                      <span>SOS Emergency</span>
                      <span className="text-[8px] opacity-75 font-mono">Dispatch Panic Alerts</span>
                    </button>
                  </div>
                </div>

                {/* Interactive Aria guard widget */}
                <ChatbotWidget
                  userPos={userPos}
                  onSendMessage={handleAriaSendMessage}
                  messages={chatMessages}
                  setMessages={setChatMessages}
                />

              </div>

            </div>

            {/* Right Map split layer columns */}
            <div className="lg:col-span-7 flex flex-col h-full bg-white border border-slate-200 rounded-3xl p-3 relative min-h-[460px] shadow-sm">
              <AestheticMap
                selectedRoute={selectedRoute}
                reports={reports}
                userPos={userPos}
                activePathIndex={0}
                isSimulating={isSimulating}
                onMapClick={handleMapSelection}
                devMode={devMode}
                onSimulateDeviation={handleSimulateDeviation}
                isDeviated={isDeviated}
              />
            </div>

          </div>
        )}

        {/* View Section 3: History Lists */}
        {activeTab === "history" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 text-left max-w-2xl mx-auto my-auto w-full flex flex-col justify-stretch min-h-[400px] shadow-sm">
            <div>
              <h2 className="text-base font-black text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                <HistoryIcon className="w-5 h-5 text-violet-605" />
                DURABLE COMMUTE ARCHIVE
              </h2>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Persistent database listing of completed commuting segments securely logged locally. Touch any log record to outline its coordinate polyline in the sandbox active screen.
              </p>
            </div>

            <div className="mt-6 flex-grow space-y-3.5 max-h-[350px] overflow-y-auto pr-1 text-left">
              {pastCommutes.length === 0 ? (
                <div className="py-12 text-center text-slate-500 font-mono text-xs flex flex-col items-center gap-2">
                  <span>No completed commutes detected. Run the dashboard simulation node trajectory completely to write logging blocks.</span>
                </div>
              ) : (
                pastCommutes.map((commute, index) => (
                   <div
                     key={index}
                     onClick={() => handleReviewPastCommute(commute)}
                     className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 hover:border-violet-300 transition-all border border-slate-200 cursor-pointer flex flex-col gap-2 relative group shadow-sm"
                   >
                     <div className="flex justify-between items-start gap-1.5">
                       <div>
                         <strong className="text-slate-700 text-xs block group-hover:text-violet-605 transition-colors">{commute.routeChosen}</strong>
                         <span className="text-[9.5px] text-slate-500 font-medium">From {commute.originName} to {commute.destName}</span>
                       </div>

                       {/* Safety Score pill */}
                       <span className="px-2 py-0.5 rounded-lg border border-emerald-200 bg-emerald-50 text-[10px] font-mono text-emerald-700 font-bold shrink-0">
                         {commute.safetyScore}% Safe
                       </span>
                     </div>

                     <div className="text-[10px] text-slate-500 flex justify-between items-center border-t border-slate-200 pt-2 font-mono gap-1.5 mt-1">
                       <span>⏱ {commute.duration} ({commute.distance})</span>
                       <span>Logged: {new Date(commute.timestamp).toLocaleString([], { hour12: true })}</span>
                     </div>
                   </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* View Section 4: Profile Tab */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch my-auto max-w-4xl mx-auto w-full">
            
            {/* User Bio and details card */}
            <div className={`md:col-span-5 p-6 rounded-3xl border text-left ${
              isDarkMode 
                ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-xl' 
                : 'bg-white border-slate-200 text-slate-800 shadow-sm'
            }`}>
              <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100 dark:border-slate-805">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-rose-500 p-0.5 shadow-lg mb-4">
                  <div className={`w-full h-full rounded-full ${isDarkMode ? 'bg-slate-900' : 'bg-white'} flex items-center justify-center`}>
                    <User className="w-10 h-10 text-violet-500" />
                  </div>
                </div>
                
                <h2 className="text-xl font-black">{currentUser.name}</h2>
                <p className="text-xs text-slate-450 mt-1 font-mono">{currentUser.email}</p>
                
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-505 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider mt-3">
                  🛡️ GUARDIAN MEMBERSHIP ACTIVE
                </span>
              </div>

              <div className="py-4 space-y-3.5 text-xs text-left">
                <div className="flex justify-between items-center font-medium">
                  <span className="text-slate-400">Verified Phone Node:</span>
                  <span className="font-mono font-bold">{currentUser.phone || "+91 98480 32910"}</span>
                </div>
                <div className="flex justify-between items-center font-medium">
                  <span className="text-slate-400">Verified Email Status:</span>
                  <span className="font-bold text-emerald-500">Completed ✔</span>
                </div>
                <div className="flex justify-between items-center font-medium">
                  <span className="text-slate-400">Emergency Contacts Group:</span>
                  <span className="font-bold font-mono">{contactsAlerted.length} Active Guardians</span>
                </div>
                <div className="flex justify-between items-center font-medium">
                  <span className="text-slate-400">Theme Preference:</span>
                  <span className="font-bold uppercase text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border dark:border-slate-700">
                    {isDarkMode ? "Dark Combat" : "Light Shield"}
                  </span>
                </div>
              </div>
            </div>

            {/* User Preferences and location telemetry */}
            <div className={`md:col-span-7 p-6 rounded-3xl border text-left flex flex-col justify-between ${
              isDarkMode 
                ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-xl' 
                : 'bg-white border-slate-200 text-slate-800 shadow-sm'
            }`}>
              
              <div>
                <h3 className="text-sm font-black uppercase tracking-wide flex items-center gap-1.5 mb-3">
                  <Activity className="w-4 h-4 text-violet-500" />
                  Live Geolocation Telemetry Logs
                </h3>

                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} leading-relaxed mb-4`}>
                  Manage your browser precision trackers and calibrate physical devices directly from the SafeHer satellite grid.
                </p>

                <div className="space-y-3 mt-4">
                  <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-150'} border text-xs`}>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="block text-[8.5px] uppercase font-mono text-slate-400 font-bold mb-0.5">CURRENT LATITUDE</span>
                        <strong className="text-sm font-mono tracking-tight">{detectedCoords?.lat.toFixed(6) || "17.44829"}</strong>
                      </div>
                      
                      <div>
                        <span className="block text-[8.5px] uppercase font-mono text-slate-400 font-bold mb-0.5">CURRENT LONGITUDE</span>
                        <strong className="text-sm font-mono tracking-tight">{detectedCoords?.lng.toFixed(6) || "78.37410"}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3.5 pt-3.5 border-t border-slate-200/60 dark:border-slate-800/60 font-medium">
                      <div>
                        <span className="block text-[8.5px] uppercase font-mono text-slate-400 font-bold mb-0.5">PRECISION SOURCE</span>
                        <strong className={`text-[11px] uppercase font-extrabold flex items-center gap-1 ${geoStatus === 'gps' ? 'text-emerald-500' : 'text-amber-500'}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                          {geoStatus === 'gps' ? "Accurate GPS Chipset" : "IP Geolocation API"}
                        </strong>
                      </div>
                      
                      <div>
                        <span className="block text-[8.5px] uppercase font-mono text-slate-400 font-bold mb-0.5">ESTIMATED CITY NODE</span>
                        <strong className="text-xs truncate block">{detectedCity}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Active theme switcher inside card */}
                  <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
                    isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span>Applet System Theme Preference</span>
                    <button
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className={`px-3 py-1 text-[11px] rounded-lg font-bold border transition-all cursor-pointer ${
                        isDarkMode 
                          ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-amber-400' 
                          : 'bg-white border-slate-200 hover:bg-slate-100 text-violet-600 shadow-sm'
                      }`}
                    >
                      {isDarkMode ? "🌙 Switch to Light" : "☀️ Switch to Dark"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center gap-3">
                <button
                  onClick={triggerGPSRecalibration}
                  disabled={gpsLoading}
                  className={`px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-45 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer`}
                >
                  <Compass className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                  {gpsLoading ? "Syncing..." : "Calibrate GPS Tracker Now"}
                </button>

                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer border ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white' 
                      : 'bg-white border-slate-250 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Go to Maps
                </button>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Flag Report Popup Form Modal overlay */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-left select-none">
            <div className="flex justify-between items-center mb-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-950/30 border border-violet-900 rounded-full text-[9px] text-violet-300 font-mono font-bold uppercase">
                Dropped Pin Alert Dispatch
              </span>
              <button 
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-base font-extrabold text-white uppercase tracking-tight">Report Commuting Hazard</h3>
            <p className="text-[10px] text-slate-450 mt-1 leading-normal">
              Flag unlit segments, harassment spots, or road blockages. Submissions broadcast to active SafeHer coordinates immediately using Socket.io.
            </p>

            <form onSubmit={handlePostReport} className="space-y-3 mt-4">
              <div>
                <label className="block text-[8.5px] uppercase tracking-wider font-mono text-slate-500 mb-1">Issue Category</label>
                <select 
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none text-xs rounded-xl py-2 px-3 text-slate-200 outline-none"
                >
                  <option value="poor_lighting">💡 Broken / Poor Lighting</option>
                  <option value="harassment">⚠️ Loitering / Harassment Spot</option>
                  <option value="isolated">🪘 Deserted / Isolated pathway</option>
                  <option value="closure">🛑 Transit Blocked / Under construction</option>
                </select>
              </div>

              <div>
                <label className="block text-[8.5px] uppercase tracking-wider font-mono text-slate-500 mb-1">Alert Title</label>
                <input 
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g. Broken streetlight outer KBR wall"
                  className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none text-xs rounded-xl py-2 px-3 text-slate-200 outline-none placeholder:text-slate-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[8.5px] uppercase tracking-wider font-mono text-slate-500 mb-1">Detailed description</label>
                <textarea 
                  rows={2}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Please describe why this stretch is highly unsafe..."
                  className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none text-xs rounded-xl py-2 px-3 text-slate-200 outline-none placeholder:text-slate-650"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[8.5px] uppercase tracking-wider font-mono text-slate-500 mb-1">Severity scale</label>
                  <select 
                    value={reportSeverity}
                    onChange={(e) => setReportSeverity(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none text-xs rounded-xl py-1.5 px-2 text-slate-200 outline-none"
                  >
                    <option value="Low">Low Alarm</option>
                    <option value="Medium">Medium Alert</option>
                    <option value="High">🚨 High Emergency</option>
                  </select>
                </div>

                <div className="text-right flex flex-col justify-end text-[10px] font-mono text-slate-400 pr-1">
                  <div>Lat: {reportLat.toFixed(4)}</div>
                  <div>Lng: {reportLng.toFixed(4)}</div>
                </div>
              </div>

              <button 
                id="btn-submit-hazard-alert"
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg active:scale-[0.98] mt-2 cursor-pointer"
              >
                Publish Safety Report
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
