"use client";

import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();
  const [emailText, setEmailText] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [loadingExtract, setLoadingExtract] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [message, setMessage] = useState("");
  const [scheduledLinks, setScheduledLinks] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      window.scrollTo(0, 0);
    }
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md w-full">
          <div className="text-6xl mb-6">📅</div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Calendar AI</h1>
          <p className="text-slate-500 mb-8">
            Instantly turn your emails into Google Calendar events using AI.
          </p>
          <button
            onClick={() => signIn("google")}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white font-semibold rounded-xl shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  const handleExtract = async () => {
    if (!emailText.trim()) {
      setMessage("Please paste an email first.");
      return;
    }

    setLoadingExtract(true);
    setScheduledLinks([]); // Clear old links
    setMessage("🤖 AI is reading your email...");
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_text: emailText }),
      });
      const data = await res.json();
      if (res.ok) {
        let extractedEvents = data.events || [];
        if (!data.events && data.title) {
          extractedEvents = [data]; // Fallback
        }
        
        extractedEvents = extractedEvents.map((ev: any) => {
          // Force strip 'Z' so we treat the AI's output purely as local time
          let startStr = ev.start_time ? ev.start_time.replace('Z', '') : null;
          let endStr = ev.end_time ? ev.end_time.replace('Z', '') : null;
          
          if (startStr && !endStr) {
            const start = new Date(startStr);
            if (!isNaN(start.getTime())) {
              start.setHours(start.getHours() + 1);
              // Format back to local ISO string (YYYY-MM-DDTHH:mm:ss) without Z
              const tzOffset = start.getTimezoneOffset() * 60000;
              endStr = new Date(start.getTime() - tzOffset).toISOString().slice(0, 19);
            }
          }
          return { ...ev, start_time: startStr, end_time: endStr };
        });

        setEvents(extractedEvents);
        setMessage(`✨ Success! Found ${extractedEvents.length} event(s).`);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      setMessage("❌ Failed to extract details.");
    }
    setLoadingExtract(false);
  };

  const handleScheduleAll = async () => {
    setLoadingSchedule(true);
    setScheduledLinks([]);
    setMessage("⏳ Scheduling events to your Google Calendar...");
    try {
      // Ensure all dates are converted to strict ISO strings (UTC) based on the browser's local timezone
      const finalEvents = events.map(ev => ({
        ...ev,
        start_time: ev.start_time ? new Date(ev.start_time).toISOString() : null,
        end_time: ev.end_time ? new Date(ev.end_time).toISOString() : null
      }));

      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: finalEvents }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`🎉 Success! Scheduled ${data.links.length} event(s).`);
        setScheduledLinks(data.links || []);
        setEvents([]);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      setMessage("❌ Failed to schedule events.");
    }
    setLoadingSchedule(false);
  };

  const updateEvent = (index: number, field: string, value: any) => {
    const updated = [...events];
    updated[index][field] = value;
    setEvents(updated);
  };

  const formatForInput = (isoString?: string) => {
    if (!isoString) return "";
    // If the AI gives us a raw local ISO string like "2026-08-28T12:00:00", just truncate it to 16 chars for the input
    // If it has a Z, we can just strip the Z so it renders exactly at the numerical time the AI predicted
    return isoString.replace('Z', '').slice(0, 16);
  };

  const parseFromInput = (localString: string) => {
    if (!localString) return null;
    // Just return the raw YYYY-MM-DDTHH:mm so we send it exactly as-is to the backend
    return localString;
  };

  const removeEvent = (index: number) => {
    const updated = events.filter((_, i) => i !== index);
    setEvents(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-5 sm:gap-0 mb-10">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
            <span className="text-4xl">📅</span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight whitespace-nowrap">Calendar AI</h1>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full shadow-sm border border-slate-200 max-w-full">
              <div className="w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
              <span className="text-xs sm:text-sm font-medium text-slate-600 truncate max-w-[150px] sm:max-w-[200px]">{session?.user?.email}</span>
            </div>
            <button
              onClick={() => signOut()}
              className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 hover:bg-slate-50 shrink-0"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mb-6 transition-all hover:shadow-md">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-sm">1</span>
            Paste Email Content
          </h3>
          <textarea
            className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 resize-none"
            placeholder="Hi team, let's schedule a design review for next Tuesday at 2 PM..."
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
          />
          <button
            onClick={handleExtract}
            disabled={loadingExtract}
            className="mt-5 w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {loadingExtract ? "Extracting..." : "✨ Magic Extract"}
          </button>
        </div>

        {/* Status Message */}
        {(message || scheduledLinks.length > 0) && (
          <div className={`p-4 mb-6 rounded-xl font-medium text-center shadow-sm border ${message.includes('Success') || message.includes('🎉') ? 'bg-green-50 text-green-800 border-green-200' : message.includes('Error') || message.includes('❌') ? 'bg-red-50 text-red-800 border-red-200' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>
            <p>{message}</p>
            {scheduledLinks.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-3">
                {scheduledLinks.map((link, i) => (
                  <a key={i} href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm bg-white px-3 py-1.5 rounded-full border border-green-300 text-green-700 hover:bg-green-100 transition-colors shadow-sm">
                    🔗 View Event {i + 1}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Results Section */}
        {events.length > 0 && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-sm">2</span>
              Review & Schedule ({events.length} found)
            </h3>
            
            <div className="space-y-6">
              {events.map((ev, i) => (
                <div key={i} className="p-6 bg-slate-50 border border-slate-200 rounded-xl relative group hover:border-indigo-300 transition-colors">
                  <div className="absolute top-0 right-0 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-bl-lg rounded-tr-xl text-xs font-bold uppercase tracking-wider border-b border-l border-indigo-200">
                    Event {i + 1}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Event Title</label>
                      <input
                        type="text"
                        value={ev.title || ""}
                        onChange={(e) => updateEvent(i, "title", e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Location / Link</label>
                      <input
                        type="text"
                        value={ev.location || ""}
                        onChange={(e) => updateEvent(i, "location", e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                        placeholder="e.g. Zoom, Room 402"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Start Time</label>
                      <input
                        type="datetime-local"
                        value={formatForInput(ev.start_time)}
                        onChange={(e) => updateEvent(i, "start_time", parseFromInput(e.target.value))}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">End Time</label>
                      <input
                        type="datetime-local"
                        value={formatForInput(ev.end_time)}
                        onChange={(e) => updateEvent(i, "end_time", parseFromInput(e.target.value))}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description Context</label>
                      <textarea
                        value={ev.description || ""}
                        onChange={(e) => updateEvent(i, "description", e.target.value)}
                        className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 h-24 resize-none mb-3"
                      />
                      <div className="flex justify-end">
                        <button 
                          onClick={() => removeEvent(i)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg text-sm font-semibold transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Event
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleScheduleAll}
              disabled={loadingSchedule}
              className="mt-8 w-full py-4 bg-emerald-500 text-white font-bold rounded-xl shadow-sm hover:bg-emerald-600 hover:shadow-md focus:ring-4 focus:ring-emerald-100 disabled:opacity-70 disabled:cursor-not-allowed transition-all text-lg flex items-center justify-center gap-2"
            >
              {loadingSchedule ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Scheduling...
                </>
              ) : (
                "📅 Add All to Google Calendar"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
