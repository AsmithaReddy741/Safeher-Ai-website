import React, { useState, useEffect } from "react";
import { SafetyRoute } from "../types";
import { Navigation, MapPin, Sparkles, Loader2, Compass, Volume2, VolumeX, Shield, AlertTriangle } from "lucide-react";

interface RoutePlannerProps {
  onSearch: (origin: string, destination: string, timeOfDay: string) => void;
  isLoading: boolean;
  routes: SafetyRoute[];
  selectedRoute: SafetyRoute | null;
  onSelectRoute: (route: SafetyRoute) => void;
  onStartJourney: () => void;
  aiSummary: string;
}

export default function RoutePlanner({
  onSearch,
  isLoading,
  routes,
  selectedRoute,
  onSelectRoute,
  onStartJourney,
  aiSummary
}: RoutePlannerProps) {
  const [origin, setOrigin] = useState("Madhapur Metro Station");
  const [destination, setDestination] = useState("Gachibowli DLF Phase 2");
  const [timeOfDay, setTimeOfDay] = useState("Late Night (11:15 PM)");
  const [speechActiveRoute, setSpeechActiveRoute] = useState<string | null>(null);

  const presets = [
    { from: "Madhapur Metro Station", to: "Gachibowli DLF Phase 2", label: "Madhapur to Gachibowli" },
    { from: "Hitec City Cyber Towers", to: "Kondapur Police Station", label: "Hitec City to Kondapur" },
    { from: "Nizamabad Bus Stand", to: "Armoor Junction", label: "Nizamabad to Armoor [Long]" },
  ];

  const handlePresetClick = (from: string, to: string) => {
    setOrigin(from);
    setDestination(to);
    onSearch(from, to, timeOfDay);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(origin, destination, timeOfDay);
  };

  const handleSpeakRoute = (e: React.MouseEvent, route: SafetyRoute) => {
    e.stopPropagation(); // prevent triggering route card selection

    if (speechActiveRoute === route.name) {
      window.speechSynthesis.cancel();
      setSpeechActiveRoute(null);
      return;
    }

    // Stop speaking any other active utterances
    window.speechSynthesis.cancel();

    // Prepare speech content
    const speechText = `Route safety evaluation: ${route.name}. It has a safety score of ${route.safetyScore} percent. ${route.description}. Lights are ${route.lightingLevel}.`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.onend = () => {
      setSpeechActiveRoute(null);
    };
    utterance.onerror = () => {
      setSpeechActiveRoute(null);
    };

    setSpeechActiveRoute(route.name);
    window.speechSynthesis.speak(utterance);
  };

  // Stop window speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm selection:bg-violet-500/25">
      
      {/* Wave Height Style */}
      <style>{`
        @keyframes pulseHeight {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
      `}</style>

      <div>
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
          <Navigation className="w-5 h-5 text-violet-600" />
          AI Safe Route Recommendations
        </h2>
        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
          Input origin and transit centers. SafeHer evaluates street lighting levels, police patrolling logs, and crowdsourced hazard pins.
        </p>
      </div>

      {/* Suggestion presets */}
      <div className="flex flex-wrap gap-1.5 font-sans">
        {presets.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => handlePresetClick(preset.from, preset.to)}
            className="px-2.5 py-1 text-[10px] rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-650 transition-all font-semibold cursor-pointer"
          >
            📍 {preset.label}
          </button>
        ))}
      </div>

      {/* Input controls */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 font-sans">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[9px] uppercase tracking-widest font-mono text-slate-400 mb-1">Commute Origin</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-violet-500" />
              <input
                id="inp-route-origin"
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Starting coordinates or area..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 focus:outline-none text-xs rounded-xl py-2.5 pl-9 pr-3 text-slate-800 outline-none transition-all placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-widest font-mono text-slate-400 mb-1">Commute Destination</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-fuchsia-500" />
              <input
                id="inp-route-dest"
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Ending target area..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 focus:outline-none text-xs rounded-xl py-2.5 pl-9 pr-3 text-slate-800 outline-none transition-all placeholder:text-slate-400"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-[9px] uppercase tracking-widest font-mono text-slate-400 mb-1">Transit Timeframe</label>
            <select
              id="select-route-time"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 focus:outline-none text-xs rounded-xl py-2.5 px-3 text-slate-800 outline-none transition-all"
            >
              <option value="Dusk Travel (07:30 PM)">Dusk Travel (07:30 PM)</option>
              <option value="Late Night (11:15 PM)">Late Night (11:15 PM)</option>
              <option value="Midnight Hours (02:30 AM)">Midnight Hours (02:30 AM)</option>
              <option value="Dawn Travel (05:40 AM)">Dawn Travel (05:40 AM)</option>
            </select>
          </div>

          <button
            id="btn-evaluate-safety-route"
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-fuchsia-200 active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                SENSING SHIELD...
              </>
            ) : (
              <>
                <Compass className="w-3.5 h-3.5" />
                FIND SAFE ROUTES
              </>
            )}
          </button>
        </div>
      </form>

      {/* AI verdict card with Speech Synthesis button */}
      {aiSummary && (
        <div className="p-3.5 bg-violet-50 border border-violet-100 rounded-2xl flex gap-3 items-start relative overflow-hidden font-sans">
          <div className="p-1.5 rounded-xl bg-violet-100 text-violet-600 mt-0.5 shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-[9px] uppercase tracking-widest font-mono font-bold text-violet-750 flex items-center justify-between">
              <span>SafeHer AI Commute Verdict</span>
              
              <div className="flex items-center gap-1.5">
                {speechActiveRoute === "VerdictSummary" && (
                  <div className="flex items-center gap-0.5 h-3.5 px-1 bg-violet-50 border border-violet-200 rounded-md">
                    <div className="w-[1.5px] bg-violet-500 animate-[pulseHeight_0.5s_ease-in-out_infinite]" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-[1.5px] bg-fuchsia-500 animate-[pulseHeight_0.5s_ease-in-out_infinite]" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-[1.5px] bg-rose-500 animate-[pulseHeight_0.5s_ease-in-out_infinite]" style={{ animationDelay: "300ms" }}></div>
                  </div>
                )}
                
                <button
                  id="btn-speak-verdict-summary"
                  color="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (speechActiveRoute === "VerdictSummary") {
                      window.speechSynthesis.cancel();
                      setSpeechActiveRoute(null);
                    } else {
                      window.speechSynthesis.cancel();
                      const utterance = new SpeechSynthesisUtterance(aiSummary);
                      utterance.onend = () => setSpeechActiveRoute(null);
                      utterance.onerror = () => setSpeechActiveRoute(null);
                      setSpeechActiveRoute("VerdictSummary");
                      window.speechSynthesis.speak(utterance);
                    }
                  }}
                  className="p-1 rounded bg-violet-150 hover:bg-violet-200 border border-violet-250 text-[9px] font-bold text-violet-700 flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                  title="Toggle safety explanation reader"
                >
                  {speechActiveRoute === "VerdictSummary" ? <VolumeX className="w-3 h-3 text-red-500" /> : <Volume2 className="w-3 h-3 text-violet-600" />}
                  {speechActiveRoute === "VerdictSummary" ? "Stop Speech" : "Listen Safety Analysis"}
                </button>
              </div>
            </div>
            
            <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">
              {aiSummary}
            </p>
          </div>
        </div>
      )}

      {/* Routes List */}
      {routes.length > 0 && (
        <div className="flex flex-col gap-3 font-sans">
          <label className="text-[9px] uppercase tracking-widest font-mono text-slate-400">PROPOSED STREET CORRIDORS ({routes.length})</label>
          
          <div className="flex flex-col gap-2.5">
            {routes.map((route, index) => {
              const isSelected = selectedRoute?.name === route.name;
              const hasHighSc = route.safetyScore >= 90;
              const hasMedSc = route.safetyScore >= 70 && route.safetyScore < 90;
              
              const scoreColor = hasHighSc 
                ? "text-emerald-700 bg-emerald-50 border-emerald-200" 
                : hasMedSc 
                  ? "text-amber-700 bg-amber-50 border-amber-200" 
                  : "text-rose-700 bg-rose-50 border-rose-200";

              return (
                <div
                  key={index}
                  onClick={() => onSelectRoute(route)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-3 relative overflow-hidden ${
                    isSelected 
                      ? "bg-slate-50/65 border-violet-500 shadow-sm" 
                      : "bg-white border-slate-200 hover:bg-slate-50/40"
                  }`}
                >
                  {/* Select fuchsia border strip */}
                  {isSelected && <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-gradient-to-b from-violet-600 to-fuchsia-600" />}

                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 text-left">
                      <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5 leading-tight">
                        {route.name}
                      </div>
                      <p className="text-[10px] text-slate-550 leading-relaxed mt-1">
                        {route.description}
                      </p>
                    </div>

                    {/* Score badge with Speech control built-in */}
                    <div className="flex flex-col items-end shrink-0 gap-1.5 select-none">
                      <div className={`px-2.5 py-1 rounded-xl border text-[11px] font-mono font-black flex flex-col items-center ${scoreColor}`}>
                        <span>{route.safetyScore}%</span>
                        <span className="text-[7.5px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">SCORE</span>
                      </div>

                      {/* Speaker synthesize trigger */}
                      <button
                        color="button"
                        onClick={(e) => handleSpeakRoute(e, route)}
                        className={`p-1.5 rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
                          speechActiveRoute === route.name 
                            ? "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-600" 
                            : "bg-slate-50 border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-700"
                        }`}
                        title="Read route analysis aloud"
                      >
                        {speechActiveRoute === route.name ? (
                          <div className="flex items-center gap-0.5 h-3 px-0.5 shrink-0">
                            <div className="w-[1px] bg-fuchsia-500 animate-[pulseHeight_0.5s_ease-in-out_infinite]" style={{ animationDelay: "0ms" }}></div>
                            <div className="w-[1px] bg-rose-505 animate-[pulseHeight_0.5s_ease-in-out_infinite]" style={{ animationDelay: "150ms" }}></div>
                            <div className="w-[1px] bg-fuchsia-500 animate-[pulseHeight_0.5s_ease-in-out_infinite]" style={{ animationDelay: "300ms" }}></div>
                          </div>
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 shrink-0" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Attribute stats */}
                  <div className="flex flex-wrap gap-1.5 text-[9px] text-slate-500 font-mono select-none">
                    <span className="bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                      ⏱ {route.duration} ({route.distance})
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg border ${
                      route.lightingLevel === "Excellent" 
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200" 
                        : route.lightingLevel === "Moderate" 
                          ? "text-amber-700 bg-amber-50 border-amber-200" 
                          : "text-rose-700 bg-rose-50 border-rose-200"
                    }`}>
                      💡 Lights: {route.lightingLevel}
                    </span>
                    <span className="bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                      👥 Crowds: {route.crowdVibe}
                    </span>
                    {route.safeHavens.length > 0 && (
                      <span className="text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-lg font-bold">
                        🛡 {route.safeHavens.length} SAFE HUBS SECURED
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-relaxed text-left">
                      <div>
                        <div className="text-[9px] font-mono text-emerald-600 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                          <Shield className="w-3 h-3 text-emerald-500" />
                          ROUTE STRENGTHS
                        </div>
                        <ul className="list-inside list-disc text-slate-600 flex flex-col gap-0.5 text-[10.5px]">
                          {route.highlights.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-[9px] font-mono text-rose-600 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-500" />
                          NOTED HAZARDS
                        </div>
                        <ul className="list-inside list-disc text-slate-600 flex flex-col gap-0.5 text-[10.5px]">
                          {route.hazards.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* Active travel launcher */}
          {selectedRoute && (
            <button
              id="btn-start-tracking-sim"
              onClick={onStartJourney}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-md shadow-violet-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-white shrink-0" />
              Start Transit Simulation Escort
            </button>
          )}

        </div>
      )}
    </div>
  );
}
