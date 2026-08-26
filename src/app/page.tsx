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
    
    if ((session as any)?.error === "RefreshAccessTokenError") {
      signIn("google");
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-zinc-50 via-white to-violet-50 px-4">
        <div className="bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/50 text-center max-w-md w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-500 to-indigo-500"></div>
          <div className="text-6xl mb-6 transform hover:scale-110 transition-transform duration-300">🗓️</div>
          <h1 className="text-4xl font-black text-zinc-900 mb-3 tracking-tight">Calendar AI</h1>
          <p className="text-zinc-500 mb-10 leading-relaxed font-medium">
            Seamlessly transform raw text, emails, or messages into Google Calendar events using AI.
          </p>
          <button
            onClick={() => signIn("google")}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-zinc-900 text-white font-semibold rounded-2xl shadow-lg hover:bg-zinc-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  const handleExtract = async () => {
    if (!emailText.trim()) {
      setMessage("Please paste some text first.");
      return;
    }

    setLoadingExtract(true);
    setScheduledLinks([]); 
    setMessage("🤖 AI is reading your details...");
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
          extractedEvents = [data];
        }
        
        extractedEvents = extractedEvents.map((ev: any) => {
          let startStr = ev.start_time ? ev.start_time.replace('Z', '') : null;
          let endStr = ev.end_time ? ev.end_time.replace('Z', '') : null;
          
          if (startStr && !endStr) {
            const start = new Date(startStr);
            if (!isNaN(start.getTime())) {
              start.setHours(start.getHours() + 1);
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
        setEmailText(""); // Clear the text box on success
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
    return isoString.replace('Z', '').slice(0, 16);
  };

  const parseFromInput = (localString: string) => {
    if (!localString) return null;
    return localString;
  };

  const removeEvent = (index: number) => {
    const updated = events.filter((_, i) => i !== index);
    setEvents(updated);
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 py-6 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-violet-200">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-5 sm:gap-0 mb-6 bg-white p-4 sm:px-8 sm:py-5 rounded-3xl shadow-sm border border-zinc-100">
          <div className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-start">
            <div className="bg-gradient-to-br from-violet-500 to-indigo-600 p-2.5 rounded-2xl shadow-inner text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight whitespace-nowrap">Calendar AI</h1>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2.5 bg-zinc-50 px-4 py-2.5 rounded-full border border-zinc-200 max-w-full">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0"></div>
              <span className="text-xs sm:text-sm font-semibold text-zinc-600 truncate max-w-[150px] sm:max-w-[200px]">{session?.user?.email}</span>
            </div>
            <button
              onClick={() => signOut()}
              className="text-xs sm:text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors bg-white px-5 py-2.5 rounded-full border border-zinc-200 hover:bg-zinc-50 hover:shadow-sm shrink-0"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-sm border border-zinc-100 transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 text-violet-700 font-bold text-sm shrink-0">1</div>
            <div>
              <h3 className="text-xl font-bold text-zinc-900">Paste Event Details</h3>
              <p className="text-sm text-zinc-500 font-medium mt-1">Copy and paste any email, text message, or unstructured text.</p>
            </div>
          </div>
          <textarea
            className="w-full h-56 p-5 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 focus:bg-white outline-none transition-all text-zinc-800 resize-none font-medium text-base placeholder:text-zinc-400"
            placeholder="Hi team, let's schedule a design review for next Tuesday at 2 PM. Here is the zoom link: ..."
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
          />
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleExtract}
              disabled={loadingExtract}
              className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-lg rounded-2xl hover:from-violet-700 hover:to-indigo-700 hover:shadow-lg hover:-translate-y-0.5 focus:ring-4 focus:ring-violet-500/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center justify-center gap-2"
            >
              {loadingExtract ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Extracting...
                </>
              ) : "✨ Magic Extract"}
            </button>
          </div>
        </div>

        {/* Status Message */}
        {(message || scheduledLinks.length > 0) && (
          <div className={`p-5 rounded-2xl font-semibold text-center border transition-all duration-300 ${message.includes('Success') || message.includes('🎉') ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : message.includes('Error') || message.includes('❌') ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>
            <p className="text-[15px]">{message}</p>
            {scheduledLinks.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {scheduledLinks.map((link, i) => (
                  <a key={i} href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold bg-white px-4 py-2 rounded-xl border border-emerald-300 text-emerald-700 hover:bg-emerald-500 hover:text-white transition-colors shadow-sm">
                    🔗 View Event {i + 1}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Results Section */}
        {events.length > 0 && (
          <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-sm border border-zinc-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 text-violet-700 font-bold text-sm shrink-0">2</div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900">Review & Schedule</h3>
                <p className="text-sm text-zinc-500 font-medium mt-1">We found {events.length} event(s). Verify the details before adding to your calendar.</p>
              </div>
            </div>
            
            <div className="space-y-8">
              {events.map((ev, i) => (
                <div key={i} className="p-6 sm:p-8 bg-zinc-50 rounded-3xl relative group border border-zinc-200 hover:border-violet-300 transition-colors shadow-sm overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-violet-500"></div>
                  <div className="absolute top-0 right-0 bg-violet-100 text-violet-700 px-4 py-1.5 rounded-bl-2xl font-bold text-xs uppercase tracking-widest border-b border-l border-violet-200">
                    Event {i + 1}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Event Title</label>
                      <input
                        type="text"
                        value={ev.title || ""}
                        onChange={(e) => updateEvent(i, "title", e.target.value)}
                        className="w-full p-3.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none text-zinc-900 font-bold text-lg transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Start Time</label>
                      <input
                        type="datetime-local"
                        value={formatForInput(ev.start_time)}
                        onChange={(e) => updateEvent(i, "start_time", parseFromInput(e.target.value))}
                        className="w-full p-3.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none text-zinc-700 font-medium transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">End Time</label>
                      <input
                        type="datetime-local"
                        value={formatForInput(ev.end_time)}
                        onChange={(e) => updateEvent(i, "end_time", parseFromInput(e.target.value))}
                        className="w-full p-3.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none text-zinc-700 font-medium transition-all"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Location / Link</label>
                      <input
                        type="text"
                        value={ev.location || ""}
                        onChange={(e) => updateEvent(i, "location", e.target.value)}
                        className="w-full p-3.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none text-zinc-700 font-medium transition-all"
                        placeholder="e.g. Zoom, Room 402"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Context / Description</label>
                      <textarea
                        value={ev.description || ""}
                        onChange={(e) => updateEvent(i, "description", e.target.value)}
                        className="w-full p-4 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none text-zinc-700 font-medium h-28 resize-none mb-4 transition-all"
                      />
                      <div className="flex justify-end pt-2 border-t border-zinc-200/60">
                        <button 
                          onClick={() => removeEvent(i)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-white text-rose-600 hover:bg-rose-50 border border-zinc-200 hover:border-rose-200 rounded-xl text-sm font-bold transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
              className="mt-10 w-full py-5 bg-zinc-900 text-white font-bold rounded-2xl shadow-md hover:bg-zinc-800 hover:shadow-xl hover:-translate-y-0.5 focus:ring-4 focus:ring-zinc-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none transition-all text-lg flex items-center justify-center gap-3"
            >
              {loadingSchedule ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  Scheduling to Calendar...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Add All to Google Calendar
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
