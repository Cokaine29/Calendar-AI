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
      <div className="flex items-center justify-center min-h-screen bg-[#f5f5f7]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-300 border-t-zinc-800"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f5f7] px-4 font-sans selection:bg-blue-200">
        <div className="text-center max-w-lg w-full">
          <h1 className="text-5xl md:text-6xl font-semibold text-zinc-900 mb-6 tracking-tight">Calendar AI.</h1>
          <p className="text-xl text-zinc-500 mb-12 font-medium tracking-tight">
            The most intelligent way to schedule.
          </p>
          <button
            onClick={() => signIn("google")}
            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-zinc-900 text-white text-lg font-medium rounded-full hover:bg-zinc-800 hover:scale-[1.02] transition-all duration-300"
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
    setMessage("");
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
      } else {
        setMessage(data.error);
      }
    } catch (err) {
      setMessage("Failed to extract details.");
    }
    setLoadingExtract(false);
  };

  const handleScheduleAll = async () => {
    setLoadingSchedule(true);
    setScheduledLinks([]);
    setMessage("");
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
        setScheduledLinks(data.links || []);
        setEvents([]);
        setEmailText(""); 
      } else {
        setMessage(data.error);
      }
    } catch (err) {
      setMessage("Failed to schedule events.");
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
    <div className="min-h-screen bg-[#fbfbfd] text-zinc-900 font-sans selection:bg-blue-200">
      
      {/* Hyper-minimal Header */}
      <header className="w-full flex justify-between items-center px-6 py-8 sm:px-12 max-w-6xl mx-auto">
        <div className="text-xl font-semibold tracking-tight">Calendar AI</div>
        <div className="flex items-center gap-6">
          <span className="text-sm font-medium text-zinc-500 hidden sm:block">{session?.user?.email}</span>
          <button
            onClick={() => signOut()}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pb-24">
        
        {/* Input Section */}
        <div className="mt-12 mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-8">What needs scheduling?</h2>
          <div className="relative group">
            <textarea
              className="w-full h-64 p-8 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus:shadow-[0_8px_40px_rgb(0,0,0,0.08)] outline-none transition-shadow duration-500 text-zinc-800 resize-none font-medium text-lg placeholder:text-zinc-400 border border-zinc-200 leading-relaxed"
              placeholder="Paste any unstructured text, email, or meeting notes here..."
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
            />
          </div>
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleExtract}
              disabled={loadingExtract}
              className="px-8 py-3.5 bg-zinc-900 text-white font-medium text-base rounded-full hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              {loadingExtract ? "Analyzing..." : "Extract Events"}
            </button>
          </div>
        </div>

        {/* Error / Status Message */}
        {message && (
          <div className="mb-12 p-6 bg-rose-50 text-rose-800 rounded-3xl font-medium text-center">
            {message}
          </div>
        )}

        {/* Success Links */}
        {scheduledLinks.length > 0 && (
          <div className="mb-12 p-8 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-2xl font-semibold tracking-tight mb-6">Successfully Scheduled</h3>
            <div className="flex flex-col gap-3 max-w-sm mx-auto">
              {scheduledLinks.map((link, i) => (
                <a key={i} href={link} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-6 py-3 rounded-full transition-colors">
                  Open Event {i + 1} in Google Calendar
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Results Section */}
        {events.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-2xl font-semibold tracking-tight mb-8 px-2 text-zinc-400">Review {events.length} event(s)</h2>
            
            <div className="space-y-8">
              {events.map((ev, i) => (
                <div key={i} className="p-8 sm:p-10 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative border border-zinc-100">
                  
                  <div className="flex justify-between items-start mb-8">
                    <input
                      type="text"
                      value={ev.title || ""}
                      onChange={(e) => updateEvent(i, "title", e.target.value)}
                      placeholder="Event Title"
                      className="w-full bg-transparent outline-none text-zinc-900 font-semibold text-2xl sm:text-3xl tracking-tight placeholder:text-zinc-300"
                    />
                    <button 
                      onClick={() => removeEvent(i)}
                      className="ml-4 w-8 h-8 flex items-center justify-center text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors shrink-0"
                      title="Remove Event"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Location / Meeting Link</label>
                      <input
                        type="text"
                        value={ev.location || ""}
                        onChange={(e) => updateEvent(i, "location", e.target.value)}
                        className="w-full p-4 bg-zinc-50 rounded-2xl outline-none focus:bg-zinc-100 text-zinc-800 font-medium transition-colors border-none"
                        placeholder="Add location or video link"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Starts</label>
                        <input
                          type="datetime-local"
                          value={formatForInput(ev.start_time)}
                          onChange={(e) => updateEvent(i, "start_time", parseFromInput(e.target.value))}
                          className="w-full p-4 bg-zinc-50 rounded-2xl outline-none focus:bg-zinc-100 text-zinc-800 font-medium transition-colors border-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Ends</label>
                        <input
                          type="datetime-local"
                          value={formatForInput(ev.end_time)}
                          onChange={(e) => updateEvent(i, "end_time", parseFromInput(e.target.value))}
                          className="w-full p-4 bg-zinc-50 rounded-2xl outline-none focus:bg-zinc-100 text-zinc-800 font-medium transition-colors border-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Notes</label>
                      <textarea
                        value={ev.description || ""}
                        onChange={(e) => updateEvent(i, "description", e.target.value)}
                        className="w-full p-4 bg-zinc-50 rounded-2xl outline-none focus:bg-zinc-100 text-zinc-800 font-medium h-32 resize-none transition-colors border-none leading-relaxed"
                        placeholder="Add notes..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex justify-end">
              <button
                onClick={handleScheduleAll}
                disabled={loadingSchedule}
                className="w-full sm:w-auto px-10 py-4 bg-blue-600 text-white font-medium text-lg rounded-full hover:bg-blue-700 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all shadow-md flex items-center justify-center gap-2"
              >
                {loadingSchedule ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                    Scheduling...
                  </>
                ) : (
                  "Add to Calendar"
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
