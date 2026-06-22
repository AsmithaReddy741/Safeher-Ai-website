import React, { useState } from "react";
import { ShieldAlert, User, Mail, Lock, Sparkles, CheckCircle, ArrowRight, UserPlus, Info } from "lucide-react";

interface LoginPageProps {
  onLogin: (name: string, email: string, token: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form input States
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Toggle view and reset inputs cleanly
  const handleToggleView = () => {
    setIsSignUp(!isSignUp);
    setName("");
    setUsername("");
    setEmail("");
    setPassword("");
    setError("");
    setInfoMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");
    setIsLoading(true);

    // Validation
    if (isSignUp && !name.trim()) {
      setError("Please key in your full display name.");
      setIsLoading(false);
      return;
    }
    if (!username.trim()) {
      setError("Please key in a valid username.");
      setIsLoading(false);
      return;
    }
    if (isSignUp && (!email.trim() || !email.includes("@"))) {
      setError("Please enter a valid active email address.");
      setIsLoading(false);
      return;
    }
    if (password.length < 4) {
      setError("Security PIN/Password must be at least 4 digits.");
      setIsLoading(false);
      return;
    }

    try {
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      const payload = isSignUp
        ? { name: name.trim(), email: email.trim(), username: username.trim(), password }
        : { username: username.trim(), password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed. Try demo/1234.");
      }

      // Success login/register
      if (data.token && data.user) {
        onLogin(data.user.name, data.user.email, data.token);
      }
    } catch (err: any) {
      setError(err.message || "Connection failure to SafeHer server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (demoUser: string, demoPass: string) => {
    setError("");
    setInfoMessage("");
    setUsername(demoUser);
    setPassword(demoPass);
    
    // Quick timeout to let user see form prepending before submit
    setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: demoUser, password: demoPass })
        });
        const data = await response.json();
        if (response.ok && data.token) {
          onLogin(data.user.name, data.user.email, data.token);
        } else {
          throw new Error(data.error);
        }
      } catch (err: any) {
        // Fallback locally
        onLogin("Pranavi Rao", "pranavi.rao@gmail.com", "mock-jwt-token");
      } finally {
        setIsLoading(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex items-center justify-center p-4 sm:p-8 selection:bg-violet-100 selection:text-slate-900 relative overflow-hidden">
      
      {/* Immersive Background holographic glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-200/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-200/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl w-full items-stretch z-10">
        
        {/* Left Side: Dynamic Woman Safety Hero Panel (Only visible on lg screens) */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-8 bg-white border border-slate-200 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-violet-50/40 via-white to-fuchsia-50/40 opacity-70 z-0 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 border border-violet-100 rounded-full text-[10px] text-violet-700 font-mono font-bold uppercase tracking-widest mb-6">
              🛡️ Live Escort Network Active
            </div>
            
            <h2 className="text-3xl font-black text-slate-800 leading-tight tracking-tight">
              COMMUTE SECURELY<br/>
              WITH INTELLIGENT<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500">AI GUARDIANS</span>
            </h2>
            
            <p className="text-xs text-slate-500 mt-3 leading-relaxed max-w-sm">
              SafeHer AI acts as your digital companion. Experience live smart-routing, dynamic blackout warnings, mock defense escorts, and lightning-fast citizen emergency dispatch.
            </p>
          </div>

          {/* Premium High-Tech Live Escort Radar Screen */}
          <div className="relative z-10 my-6 overflow-hidden bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-inner min-h-[230px] flex flex-col justify-center items-center">
            {/* Ambient grid system in CSS */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            
            {/* Spinning Radar Line */}
            <div className="absolute w-44 h-44 rounded-full border border-violet-500/20 flex items-center justify-center animate-[spin_10s_linear_infinite]">
              <div className="w-full h-[1px] bg-gradient-to-r from-violet-500/0 via-violet-500/40 to-violet-500/90" />
            </div>

            {/* Concentric rings */}
            <div className="absolute w-32 h-32 rounded-full border border-violet-500/30 animate-pulse flex items-center justify-center" />
            <div className="absolute w-20 h-20 rounded-full border border-fuchsia-500/20" />
            
            {/* Pulse Locator Nodes */}
            <div className="absolute top-[20%] left-[25%] flex flex-col items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping absolute" />
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 relative" />
              <span className="text-[7px] font-mono text-rose-300 font-bold mt-1 bg-slate-950/80 px-1 rounded">DEVIATION POINT</span>
            </div>

            <div className="absolute bottom-[28%] right-[22%] flex flex-col items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
              <span className="text-[7px] font-mono text-emerald-300 font-bold mt-1 bg-slate-950/80 px-1 rounded">ARIA PATROL CO-HOST</span>
            </div>

            <div className="absolute top-[58%] left-[70%] flex flex-col items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 relative" />
              <span className="text-[7px] font-mono text-violet-300 mt-0.5 bg-slate-950/85 px-1 rounded">CITIZEN NODE #19</span>
            </div>

            {/* Glowing Center Guard Badge */}
            <div className="relative z-10 w-14 h-14 bg-gradient-to-tr from-violet-600/90 to-fuchsia-600/90 rounded-full flex items-center justify-center shadow-lg border border-violet-400">
              <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
            </div>
            
            <div className="relative z-10 mt-3 text-center">
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-violet-300">ACTIVE SHIELD GRID</p>
              <p className="text-[8px] font-mono text-slate-400 mt-0.5">LAT 12.9716° N / LON 77.5946° E</p>
            </div>

            <div className="absolute bottom-2 left-2 right-2 bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-xl text-left flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <p className="text-[9.5px] font-medium text-slate-300">
                Companion Aria dynamically calibrating secure transit pathways.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-4 border-t border-slate-100 pt-5">
            <div className="flex -space-x-2">
              <span className="w-7 h-7 rounded-full bg-violet-600 border border-white text-[9px] font-bold text-white flex items-center justify-center">S</span>
              <span className="w-7 h-7 rounded-full bg-fuchsia-500 border border-white text-[9px] font-bold text-white flex items-center justify-center">A</span>
              <span className="w-7 h-7 rounded-full bg-rose-400 border border-white text-[9px] font-bold text-white flex items-center justify-center">H</span>
            </div>
            <p className="text-[10.5px] font-medium text-slate-500">
              Join thousands of solo commuters securing their city journeys.
            </p>
          </div>
        </div>

        {/* Right Side: Core Form Credentials Entry */}
        <div className="lg:col-span-6 w-full bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col justify-between">
          
          {/* SafeHer AI Glossy Header Profile Logo with Female Silhouette */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-0.5 rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-rose-400 mb-3 shadow-md">
              <div className="bg-white px-4 py-3 rounded-2xl flex items-center gap-1.5 border border-slate-100">
                <div className="relative">
                  <ShieldAlert className="w-6 h-6 text-fuchsia-600 animate-pulse" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-mono leading-none tracking-widest text-violet-750 font-bold uppercase">SAFEHER AI</span>
                  <span className="text-[8px] font-mono text-slate-400 leading-none mt-0.5">COMMUTE GRID</span>
                </div>
              </div>
            </div>
            
            <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center justify-center gap-1.5 mt-2">
              SAFEHER <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500">AI</span>
            </h1>
            
            <p className="text-xs text-slate-500 mt-1.5 max-w-[340px] mx-auto leading-relaxed">
              Empower your night commutes with smart AI routing, real-time blackout alerts, simulated live escorts, and tactical SOS safety panels.
            </p>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 border border-violet-100 rounded-full text-[10px] text-violet-700 font-mono mt-3">
              <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-ping" />
              Companion 'Aria' Escort Console Active
            </div>
          </div>

          {/* Info alerts */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium leading-relaxed">
              ⚠️ {error}
            </div>
          )}
          {infoMessage && (
            <div className="mb-4 p-3 bg-violet-50 border border-violet-200 rounded-xl text-xs text-violet-700 font-medium">
              💡 {infoMessage}
            </div>
          )}

          {/* Input Forms */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {isSignUp && (
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-mono text-slate-500 mb-1">Display/Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    id="signup-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Pranavi Rao"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm rounded-xl py-2.5 pl-10 pr-3 text-slate-800 outline-none transition-all placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-mono text-slate-500 mb-1">User Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="login-username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g., demo"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm rounded-xl py-2.5 pl-10 pr-3 text-slate-800 outline-none transition-all placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-mono text-slate-450 mb-1">Active E-Mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pranavi@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm rounded-xl py-2.5 pl-10 pr-3 text-slate-800 outline-none transition-all placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-mono text-slate-500 mb-1">Commuter PIN Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="login-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="e.g., 1234"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm rounded-xl py-2.5 pl-10 pr-3 text-slate-800 outline-none transition-all placeholder:text-slate-400 tracking-widest"
                  required
                />
              </div>
            </div>

            <button
              id="btn-auth-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
            >
              {isLoading ? "Validating with Grid Security..." : isSignUp ? "Create Secure Account" : "Access Safety Network"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Toggle signup/login view */}
          <div className="text-center mt-4">
            <button
              id="btn-toggle-auth-view"
              onClick={handleToggleView}
              className="text-xs text-fuchsia-650 hover:text-fuchsia-500 transition-colors font-medium underline cursor-pointer"
            >
              {isSignUp ? "Already have a key? Sign In here" : "Request credentials? Register account here"}
            </button>
          </div>

          {/* Separator */}
          <div className="relative flex items-center py-4 my-2">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-[9px] font-mono text-slate-400 uppercase tracking-widest">or quick citizen override</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Demo profiles dispatch buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              id="demo-citizen-btn"
              onClick={() => handleDemoLogin("demo", "1234")}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group cursor-pointer"
            >
              <div className="text-[11px] font-bold text-slate-700 group-hover:text-violet-600 transition-colors">Pranavi Rao</div>
              <div className="text-[8px] font-mono text-slate-400">Demo User (demo/1234)</div>
            </button>
            
            <button
              id="demo-inspector-btn"
              onClick={() => handleDemoLogin("inspector", "1234")}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group cursor-pointer"
            >
              <div className="text-[11px] font-bold text-fuchsia-700 group-hover:text-fuchsia-500 transition-colors flex items-center gap-1">
                She Team Base
                <Sparkles className="w-2.5 h-2.5 text-amber-500 animate-bounce" />
              </div>
              <div className="text-[8px] font-mono text-slate-400">Official Inspector</div>
            </button>
          </div>

          <div className="mt-5 text-center text-[10px] text-slate-505 flex items-center justify-center gap-1 leading-normal">
            <Info className="w-3.5 h-3.5 text-fuchsia-600 shrink-0" />
            <span>Local fallbacks secure databases automatically under offline nodes.</span>
          </div>

        </div>

      </div>
    </div>
  );
}
