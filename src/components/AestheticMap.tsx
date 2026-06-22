import React, { useEffect, useRef, useState } from "react";
import { Coord, SafetyRoute, SafetyReport, SafeHaven } from "../types";
import { Shield, Home, Eye, AlertTriangle, Sparkles, Navigation, PlusCircle, Volume2 } from "lucide-react";

interface AestheticMapProps {
  selectedRoute: SafetyRoute | null;
  reports: SafetyReport[];
  userPos: Coord | null;
  activePathIndex: number;
  isSimulating: boolean;
  onMapClick?: (coords: Coord) => void;
  devMode: boolean;
  onSimulateDeviation?: () => void;
  isDeviated: boolean;
}

export default function AestheticMap({
  selectedRoute,
  reports,
  userPos,
  activePathIndex,
  isSimulating,
  onMapClick,
  devMode,
  onSimulateDeviation,
  isDeviated
}: AestheticMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const pathPolylineRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const startMarkerRef = useRef<any>(null);
  const endMarkerRef = useRef<any>(null);
  
  // Keep track of markers to prevent duplicates
  const POIMarkersRef = useRef<any[]>([]);
  const ReportMarkersRef = useRef<any[]>([]);

  // Local state for reporting popup helper
  const [clickedLatLng, setClickedLatLng] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // If window.L is not available yet, wait slightly
    if (!(window as any).L) {
      console.warn("Leaflet library not loaded globally yet. Retrying map build in 100ms.");
      return;
    }

    const L = (window as any).L;

    // Centered around Hyderabad Hitec City on init
    const initialLat = 17.4436;
    const initialLng = 78.3772;

    if (!mapInstanceRef.current && mapContainerRef.current) {
      // Create Leaflet map instance
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      // Authentic, high-fidelity Google Maps road vector tile layer for realistic city grid representation
      L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
        maxZoom: 20,
        attribution: "Map data © Google"
      }).addTo(map);

      // Re-position zoom controls to bottom-right out of text's way
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Map Double click to trigger incident reports
      map.on("dblclick", (e: any) => {
        const { lat, lng } = e.latlng;
        setClickedLatLng({ lat, lng });
        if (onMapClick) {
          onMapClick({ x: lat, y: lng });
        }
      });

      mapInstanceRef.current = map;
    }

    // Cleanup on destroy
    return () => {
      // In React Strict Mode, we don't fully destroy to prevent flickering, 
      // but let's make sure it is handled.
    };
  }, []);

  // Update starting and ending pins dynamically when route changes
  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map || !selectedRoute) return;

    const coords = selectedRoute.coordinates;
    if (coords.length < 2) return;

    // Start Coords: first node
    const startLat = coords[0].x;
    const startLng = coords[0].y;
    // End Coords: last node
    const endLat = coords[coords.length - 1].x;
    const endLng = coords[coords.length - 1].y;

    // Clear old start/end markers
    if (startMarkerRef.current) startMarkerRef.current.remove();
    if (endMarkerRef.current) endMarkerRef.current.remove();

    // Create custom elegant Violet DivIcon for Start Point
    const violetIcon = L.divIcon({
      className: "custom-div-icon",
      html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 border-2 border-violet-600 text-violet-700 shadow-md relative">
               <span class="w-2.5 h-2.5 rounded-full bg-violet-600"></span>
               <span class="absolute -top-1 -right-1 flex h-2 w-2">
                 <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-500 opacity-75"></span>
                 <span class="relative inline-flex rounded-full h-2 w-2 bg-violet-600"></span>
               </span>
             </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    // Create custom elegant fuchsia DivIcon for End Point
    const fuchsiaIcon = L.divIcon({
      className: "custom-div-icon",
      html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-fuchsia-100 border-2 border-fuchsia-600 text-fuchsia-700 shadow-md relative">
               <span class="w-2.5 h-2.5 rounded-full bg-fuchsia-600 animate-pulse"></span>
             </div>`,
      iconSize: [32, 28],
      iconAnchor: [16, 14]
    });

    // Mount Start & End Pins
    startMarkerRef.current = L.marker([startLat, startLng], { icon: violetIcon })
      .addTo(map)
      .bindPopup(`<strong style="color: #6d28d9">Current Starting Node</strong><br/><span style="font-size:11px; color:#475569">Active tracking starts here</span>`);

    endMarkerRef.current = L.marker([endLat, endLng], { icon: fuchsiaIcon })
      .addTo(map)
      .bindPopup(`<strong style="color: #db2777">Selected Destination Node</strong><br/><span style="font-size:11px; color:#475569">Safety checkpoint active</span>`);

    // Draw route Polyline
    if (pathPolylineRef.current) pathPolylineRef.current.remove();

    const latLngs = coords.map(c => [c.x, c.y]);
    
    // Choose neon color based on Safety Score
    const safetyColor = selectedRoute.safetyScore >= 90 ? "#10b981" : selectedRoute.safetyScore >= 70 ? "#eab308" : "#ec4899";

    pathPolylineRef.current = L.polyline(latLngs, {
      color: safetyColor,
      weight: 4,
      opacity: 0.85,
      dashArray: selectedRoute.safetyScore < 60 ? "5, 10" : "none",
      lineCap: "round",
      lineJoin: "round"
    }).addTo(map);

    // Zoom adjust target bounds
    map.fitBounds(pathPolylineRef.current.getBounds(), { padding: [40, 40] });

  }, [selectedRoute]);

  // Update live moving User Marker along simulator node coords
  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    if (!userPos) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      return;
    }

    // Create or update blue user location tracking icon
    const userLat = userPos.x;
    const userLng = userPos.y;

    // Check deviation status to change tracking avatar color (red vs emerald)
    const trackingColor = isDeviated ? "bg-rose-600 border-rose-500 text-slate-100" : "bg-emerald-600 border-emerald-500 text-emerald-500";

    const pulseIcon = L.divIcon({
      className: "custom-div-icon",
      html: `<div class="flex items-center justify-center w-7 h-7 rounded-full bg-white border border-slate-300 shadow-lg relative">
               <div class="w-5 h-5 rounded-full ${trackingColor} flex items-center justify-center font-bold text-[9px] font-mono animate-pulse text-white">
                 ME
               </div>
               <span class="absolute -inset-2.5 rounded-full border border-emerald-500/25 animate-ping opacity-60"></span>
             </div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLat, userLng]);
    } else {
      userMarkerRef.current = L.marker([userLat, userLng], { icon: pulseIcon }).addTo(map);
    }

    // Auto-pan to keep moving tracking cursor at center of map
    if (isSimulating) {
      map.panTo([userLat, userLng], { animate: true, duration: 0.5 });
    }

  }, [userPos, isDeviated, isSimulating]);

  // Render crowdsourced incident reports pins on map Layer
  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    // Remove preceding report pins
    ReportMarkersRef.current.forEach(m => m.remove());
    ReportMarkersRef.current = [];

    reports.forEach((report) => {
      // Match colors based on report categories
      const categoryColor = 
        report.type === "poor_lighting" ? "bg-amber-500 border-amber-300" : 
        report.type === "harassment" ? "bg-rose-600 border-rose-400" : 
        "bg-violet-600 border-violet-400";

      const reportIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div class="group relative flex items-center justify-center w-5 h-5 rounded-full ${categoryColor} border text-[8px] font-mono font-bold shadow-md text-white">
                 !
                 <span class="absolute inline-flex h-full w-full rounded-full bg-rose-500/30 animate-pulse"></span>
               </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const cardHtml = `
        <div style="font-family: sans-serif; color: #1e293b; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 10px; width: 220px; font-size: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: bold; text-transform: uppercase; font-size: 9px; padding: 2px 6px; background: ${report.type === 'harassment' ? '#e11d48' : '#d97706'}; border-radius: 4px; color: #fff">${report.type.replace('_',' ')}</span>
            <span style="font-size: 9px; font-family: monospace; color: #64748b">${new Date(report.timestamp).toLocaleDateString()}</span>
          </div>
          <strong style="color: #0f172a; font-size: 12px; display: block; margin-bottom: 4px;">${report.title}</strong>
          <p style="color: #475569; font-size: 11px; line-height: 1.3; margin: 0 0 8px 0;">${report.description}</p>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            <span style="color: #64748b">By: ${report.reportedBy}</span>
            <span style="color: #ca8a04; font-weight: bold">▲ ${report.upvotes} Upvotes</span>
          </div>
        </div>
      `;

      const marker = L.marker([report.latitude, report.longitude], { icon: reportIcon })
        .addTo(map)
        .bindPopup(cardHtml, { className: "custom-leaflet-popup", closeButton: false });

      ReportMarkersRef.current.push(marker);
    });

  }, [reports]);

  // Render emergency Safe Havens / POIs dynamically
  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    // Clear old POIs
    POIMarkersRef.current.forEach(m => m.remove());
    POIMarkersRef.current = [];

    if (!selectedRoute) return;

    selectedRoute.safeHavens.forEach((haven: SafeHaven) => {
      // Blue for Police, Red for Hospital/Clinics, Yellow for Convenience Stores
      const hColor = haven.type === "police" ? "bg-sky-500 border-sky-300" : haven.type === "hospital" ? "bg-emerald-500 border-emerald-300" : "bg-amber-500 border-amber-300";
      
      const havenIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div class="flex items-center justify-center w-6 h-6 rounded-full ${hColor} border-2 shadow-lg relative text-slate-950 font-bold">
                 ${haven.type === 'police' ? '👮' : haven.type === 'hospital' ? '🏥' : '🏪'}
                 <span class="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full ${hColor} animate-ping"></span>
               </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const popHtml = `
        <div style="font-family: sans-serif; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; color: #334155; font-size: 11px; box-shadow: 0 4px 10px rgba(0,0,0,0.08);">
          <strong style="color: ${haven.type === 'police' ? '#0284c7' : '#059669'}; display:block; margin-bottom: 2px;">${haven.name}</strong>
          <div>Status: <span style="color: #16a34a; font-weight: bold;">ACTIVE SAFE HAVEN</span></div>
          <div style="font-size:9px; color: #64748b; margin-top:2px;">Type: ${haven.type.toUpperCase()} • ${haven.distance}</div>
        </div>
      `;

      const marker = L.marker([haven.coords.x, haven.coords.y], { icon: havenIcon })
        .addTo(map)
        .bindPopup(popHtml);

      POIMarkersRef.current.push(marker);
    });

  }, [selectedRoute]);

  const handleMapReset = () => {
    if (mapInstanceRef.current && selectedRoute && pathPolylineRef.current) {
      mapInstanceRef.current.fitBounds(pathPolylineRef.current.getBounds(), { padding: [40, 40] });
    }
  };

  return (
    <div className="relative w-full aspect-video md:aspect-[4/3] bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-lg group selection:bg-violet-500/30">
      
      {/* Background container for Leaflet */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full z-0 relative"
        style={{ background: "#f8fafc" }}
      />

      {/* Floating Header Hud */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/95 border border-slate-200 backdrop-blur-md shadow-md">
          <div className="w-2.5 h-2.5 rounded-full bg-violet-600 animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1">
            SafeHer AI Smart Grid Matrix
            <Sparkles className="w-3 h-3 text-fuchsia-600 animate-bounce" />
          </span>
        </div>
      </div>

      {isDeviated && (
        <div className="absolute top-4 right-4 z-10 font-sans">
          <div className="animate-bounce flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-750 backdrop-blur-md shadow-xl">
            <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase">ROUTE DEVIATION ALERT</span>
          </div>
        </div>
      )}

      {/* Map Control HUD Drawer overlay */}
      <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none flex justify-between items-end font-sans">
        
        {/* Helper guide description */}
        <div className="max-w-[70%] pointer-events-auto">
          {clickedLatLng ? (
            <div className="p-3 rounded-2xl bg-white/95 border border-violet-200 backdrop-blur-md shadow-2xl text-xs text-slate-755 flex flex-col gap-1">
              <strong className="text-violet-650 flex items-center gap-1">
                <PlusCircle className="w-3.5 h-3.5 text-fuchsia-600" />
                Submit Safety Hazard Pin
              </strong>
              <p className="text-[10px] text-slate-500 leading-tight">
                Dropped pin at lat: {clickedLatLng.lat.toFixed(4)}, lng: {clickedLatLng.lng.toFixed(4)}. Double-click reports the hazard to SafeHer community in real-time.
              </p>
              <button 
                onClick={() => setClickedLatLng(null)}
                className="text-[9px] font-mono text-fuchsia-600 hover:text-fuchsia-500 text-left mt-1 font-bold underline cursor-pointer"
              >
                Dismiss Marker Selection
              </button>
            </div>
          ) : (
            <div className="px-3.5 py-2 rounded-2xl bg-white/95 border border-slate-200 backdrop-blur-md text-[10px] text-slate-650 leading-relaxed shadow-lg">
              🎯 <strong>Interactive OSM Viewport:</strong> double-click anywhere to drop a safety incident report pin or tap POIs to load safe haven centers.
            </div>
          )}
        </div>

        {/* Buttons drawer */}
        <div className="flex gap-2 pointer-events-auto shrink-0 select-none">
          {selectedRoute && (
            <button
              id="btn-recenter-route"
              onClick={handleMapReset}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-md transition-all active:scale-[0.95] cursor-pointer"
              title="Fit map boundaries to active route"
            >
              <Navigation className="w-4 h-4" />
            </button>
          )}

          {devMode && isSimulating && (
            <button
              id="btn-trigger-deviation"
              onClick={(e) => {
                e.stopPropagation();
                onSimulateDeviation?.();
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all shadow-md active:scale-[0.95] cursor-pointer ${
                isDeviated 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" 
                  : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 animate-pulse"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {isDeviated ? "Resume Normal GPS Path" : "Simulate Journey Deviation"}
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
