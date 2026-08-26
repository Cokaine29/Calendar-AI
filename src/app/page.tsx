"use client";

import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { toast } from "sonner";
import { RefreshCw, Download, CalendarPlus, FileText, CheckCircle2 } from "lucide-react";
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

const Footer = () => (
  <footer className="w-full py-12 text-center text-sm font-medium text-zinc-400">
    <p>Built by Niraj Prashant Kamble</p>
    <div className="flex justify-center gap-6 mt-3">
      <a href="https://github.com/Cokaine29" target="_blank" rel="noreferrer" className="hover:text-zinc-900 transition-colors">GitHub</a>
      <a href="https://www.linkedin.com/in/niraj-kamble-b11ra380/" target="_blank" rel="noreferrer" className="hover:text-zinc-900 transition-colors">LinkedIn</a>
      <a href="https://www.instagram.com/niraj.b11r.a380/" target="_blank" rel="noreferrer" className="hover:text-zinc-900 transition-colors">Instagram</a>
    </div>
  </footer>
);

export default function Home() {
  const { data: session, status } = useSession();
  const [emailText, setEmailText] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [loadingExtract, setLoadingExtract] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [scheduledLinks, setScheduledLinks] = useState<any[]>([]);
  
  // New Calendar State
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [calendarView, setCalendarView] = useState<'week'|'day'>('week');
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCalendarView(window.innerWidth < 768 ? 'day' : 'week');
      const handleResize = () => setCalendarView(window.innerWidth < 768 ? 'day' : 'week');
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const fetchCalendar = async (targetDate: Date = calendarDate) => {
    setLoadingCalendar(true);
    try {
      const minDate = new Date(targetDate);
      minDate.setDate(minDate.getDate() - 14);
      const maxDate = new Date(targetDate);
      maxDate.setDate(maxDate.getDate() + 14);

      const res = await fetch(`/api/calendar?timeMin=${minDate.toISOString()}&timeMax=${maxDate.toISOString()}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setUpcomingEvents(data.events || []);
      }
    } catch (err) {
      console.error("Failed to fetch calendar", err);
    }
    setLoadingCalendar(false);
  };

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

  useEffect(() => {
    if (status === "authenticated") {
      fetchCalendar();
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f5f7]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-300 border-t-zinc-800"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fbfbfd] px-4 font-sans selection:bg-blue-200">
        <div className="text-center max-w-2xl w-full mb-12">
          <h1 className="text-5xl md:text-7xl font-bold text-zinc-900 mb-6 tracking-tight">Calendar AI.</h1>
          <p className="text-xl md:text-2xl text-zinc-500 font-medium tracking-tight">
            The intelligent way to schedule.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mb-16 px-4">
          <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-zinc-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Drop Any Text</h3>
            <p className="text-sm text-zinc-500">Emails, Slack threads, WhatsApp messages. If it mentions a time, we catch it.</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-zinc-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg mb-2">AI Does the Work</h3>
            <p className="text-sm text-zinc-500">Extracts every event — titles, dates, locations, descriptions — with zero manual input.</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-zinc-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <CalendarPlus className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Straight to Calendar</h3>
            <p className="text-sm text-zinc-500">Review, edit, and push directly to Google Calendar in one click. No copy-pasting.</p>
          </div>
        </div>

        <div className="text-center w-full pb-24">
          <button
            onClick={() => signIn("google")}
            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-zinc-900 text-white text-lg font-medium rounded-full hover:bg-zinc-800 hover:scale-[1.02] transition-all duration-300 shadow-xl"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
            Continue with Google
          </button>
          <p className="mt-4 text-xs text-zinc-400 max-w-sm mx-auto">We only access your calendar to add events you approve. No emails or data are stored.</p>
        </div>
        
        <Footer />
      </div>
    );
  }

  const handleExtract = async () => {
    if (!emailText.trim()) {
      toast.error("Please paste some text first.");
      return;
    }

    setLoadingExtract(true);
    setScheduledLinks([]); 
    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_text: emailText, timezone: userTimezone }),
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

          // Conflict Detection
          let conflict = null;
          if (startStr) {
            const st = new Date(startStr).getTime();
            const et = endStr ? new Date(endStr).getTime() : st + 60*60*1000;
            const overlapping = upcomingEvents.find(existing => {
              const est = new Date(existing.start).getTime();
              const eet = existing.end ? new Date(existing.end).getTime() : est + 60*60*1000;
              return st < eet && et > est; 
            });
            if (overlapping) {
              conflict = `⚠️ Conflicts with "${overlapping.title}"`;
            }
          }

          return { ...ev, start_time: startStr, end_time: endStr, conflict };
        });

        if (extractedEvents.length === 0) {
          toast.info("No events were found in the text. Please provide specific dates and times.");
        } else {
          toast.success(`Extracted ${extractedEvents.length} event(s)!`);
        }

        setEvents(extractedEvents);
      } else {
        toast.error(data.error || "Failed to extract details.");
      }
    } catch (err) {
      toast.error("Failed to extract details.");
    }
    setLoadingExtract(false);
  };

  const handleScheduleAll = async () => {
    setLoadingSchedule(true);
    setScheduledLinks([]);
    try {
      // Validate all events before sending
      for (const ev of events) {
        if (!ev.start_time) {
          throw new Error(`Event "${ev.title || 'Untitled'}" is missing a start time.`);
        }
        const st = new Date(ev.start_time);
        if (isNaN(st.getTime())) {
          throw new Error(`Event "${ev.title || 'Untitled'}" has an invalid start time.`);
        }
        if (ev.end_time) {
          const et = new Date(ev.end_time);
          if (isNaN(et.getTime())) {
            throw new Error(`Event "${ev.title || 'Untitled'}" has an invalid end time.`);
          }
        }
      }

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
        toast.success("Successfully scheduled to your calendar!");
        setEvents([]);
        setEmailText(""); 
        fetchCalendar(); // Refresh the right-hand calendar!
      } else {
        toast.error(data.error || "Failed to schedule events.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule events.");
    }
    setLoadingSchedule(false);
  };

  const updateEvent = (index: number, field: string, value: any) => {
    const updated = [...events];
    updated[index][field] = value;
    setEvents(updated);
  };

  const exportIcs = (ev: any) => {
    if (!ev.start_time) return toast.error("Missing start time for ICS export.");
    try {
      const formatDate = (dateString: string) => {
        return new Date(dateString).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };
      
      const start = formatDate(ev.start_time);
      const end = ev.end_time ? formatDate(ev.end_time) : formatDate(new Date(new Date(ev.start_time).getTime() + 3600000).toISOString());
      
      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Calendar AI//EN',
        'BEGIN:VEVENT',
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${ev.title || 'Event'}`,
        `DESCRIPTION:${(ev.description || '').replace(/\n/g, '\\n')}`,
        `LOCATION:${ev.location || ''}`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${(ev.title || 'event').replace(/\s+/g, '_')}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("ICS file downloaded!");
    } catch (e) {
      toast.error("Failed to generate ICS file.");
    }
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

  const calendarEvents = upcomingEvents.map(ev => ({
    title: ev.title,
    start: new Date(ev.start),
    end: ev.end ? new Date(ev.end) : new Date(new Date(ev.start).getTime() + 60*60*1000), // Default 1 hour if missing
    allDay: ev.isAllDay,
    resource: ev
  }));

  // Custom event styles for the calendar
  const eventStyleGetter = (event: any, start: any, end: any, isSelected: boolean) => {
    return {
      style: {
        backgroundColor: '#3b82f6',
        borderRadius: '8px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '12px',
        fontWeight: '600'
      }
    };
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-zinc-900 font-sans selection:bg-blue-200">
      
      {/* Hyper-minimal Header */}
      <header className="w-full flex justify-between items-center px-6 py-6 sm:px-12 max-w-[120rem] mx-auto">
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

      {/* Main Split Layout */}
      <main className="max-w-[120rem] mx-auto px-6 pb-24 grid grid-cols-1 xl:grid-cols-2 gap-12 items-start mt-8">
        
        {/* Left Column: Extraction UI */}
        <div className="max-w-3xl w-full mx-auto xl:mx-0">
          <div className="mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-8">What needs scheduling?</h2>
            <div className="relative group">
              <textarea
                disabled={loadingExtract || loadingSchedule}
                className="w-full h-64 p-8 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus:shadow-[0_8px_40px_rgb(0,0,0,0.08)] outline-none transition-shadow duration-500 text-zinc-800 resize-none font-medium text-lg placeholder:text-zinc-400 border border-zinc-200 leading-relaxed disabled:opacity-50"
                placeholder="Paste an email, Slack message, or meeting notes — the AI handles the rest."
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
              />
            </div>
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleExtract}
                disabled={loadingExtract || loadingSchedule}
                className="px-8 py-3.5 bg-zinc-900 text-white font-medium text-base rounded-full hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
              >
                {loadingExtract ? "Analyzing..." : "Extract Events"}
              </button>
            </div>
          </div>

          {/* Success Links */}
          {scheduledLinks.length > 0 && (
            <div className="mb-12 p-8 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-2xl font-semibold tracking-tight mb-6">Successfully Scheduled</h3>
              <div className="flex flex-col gap-3 max-w-sm mx-auto mb-8">
                {scheduledLinks.map((item, i) => (
                  <a key={i} href={item.link} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-6 py-3 rounded-full transition-colors flex items-center justify-center gap-2">
                    <span>Open <strong>{item.title}</strong></span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                ))}
              </div>
              <button
                onClick={() => setScheduledLinks([])}
                className="text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
              >
                Schedule Another
              </button>
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
                      <div className="flex items-center gap-2 ml-4 shrink-0">
                        <button 
                          onClick={() => exportIcs(ev)}
                          className="w-8 h-8 flex items-center justify-center text-zinc-300 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                          title="Download .ics"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => removeEvent(i)}
                          className="w-8 h-8 flex items-center justify-center text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                          title="Remove Event"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {ev.conflict && (
                      <div className="mb-6 p-4 bg-amber-50 text-amber-800 rounded-xl font-medium text-sm flex items-center gap-2 border border-amber-200/50">
                        <span>{ev.conflict}</span>
                      </div>
                    )}
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Location / Meeting Link</label>
                        <input
                          type="text"
                          value={ev.location || ""}
                          onChange={(e) => updateEvent(i, "location", e.target.value)}
                          className="w-full p-4 bg-zinc-50 rounded-2xl outline-none focus:bg-zinc-100 text-zinc-800 font-medium transition-colors border-none"
                          placeholder="e.g. Room 204, Zoom link, Google Meet URL"
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
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Additional Context</label>
                        <textarea
                          value={ev.description || ""}
                          onChange={(e) => updateEvent(i, "description", e.target.value)}
                          className="w-full p-4 bg-zinc-50 rounded-2xl outline-none focus:bg-zinc-100 text-zinc-800 font-medium h-32 resize-none transition-colors border-none leading-relaxed"
                          placeholder="Agenda, pre-reads, attendee expectations..."
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
        </div>

        {/* Right Column: Weekly Calendar Grid */}
        <div className="w-full bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100/50 xl:sticky xl:top-12 h-[600px] xl:h-[800px] flex flex-col mb-12 xl:mb-0">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold tracking-tight">Upcoming Schedule</h3>
            <button 
              onClick={() => fetchCalendar(calendarDate)}
              disabled={loadingCalendar}
              className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors disabled:opacity-50"
              title="Refresh Calendar"
            >
              <RefreshCw className={`w-5 h-5 ${loadingCalendar ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          {loadingCalendar && upcomingEvents.length === 0 ? (
            <div className="flex justify-center items-center flex-1 pb-16">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-300 border-t-zinc-800"></div>
            </div>
          ) : (
            <div className="flex-1 min-h-0">
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                view={calendarView}
                onView={(v) => setCalendarView(v as 'week'|'day')}
                views={['week', 'day']}
                date={calendarDate}
                onNavigate={(newDate) => {
                  setCalendarDate(newDate);
                  fetchCalendar(newDate);
                }}
                min={new Date(2025, 1, 1, 6, 0, 0)} // Starts at 6 AM
                max={new Date(2025, 1, 1, 23, 59, 59)} // Ends at Midnight
                scrollToTime={new Date(2025, 1, 1, 8, 0, 0)} // Auto-scrolls to 8 AM on load
                eventPropGetter={eventStyleGetter}
                onSelectEvent={(event) => {
                  if (event.resource.htmlLink) {
                    window.open(event.resource.htmlLink, '_blank');
                  }
                }}
                style={{ height: '100%', width: '100%', fontFamily: 'inherit' }}
              />
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Calendar Override Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .rbc-calendar {
          border: none;
        }
        .rbc-time-view {
          border: none;
          border-top: 1px solid #f4f4f5;
        }
        .rbc-time-header {
          border-bottom: 1px solid #f4f4f5;
        }
        .rbc-header {
          border-bottom: none;
          border-left: 1px solid #f4f4f5;
          padding: 12px 0;
          font-weight: 600;
          color: #71717a;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
        }
        .rbc-time-content {
          border-top: none;
        }
        .rbc-time-content > * + * > * {
          border-left: 1px solid #f4f4f5;
        }
        .rbc-timeslot-group {
          border-bottom: 1px solid #f4f4f5;
          min-height: 60px;
        }
        .rbc-time-slot {
          border-top: none;
        }
        .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid #fafafa;
        }
        .rbc-day-slot .rbc-events-container {
          margin-right: 4px;
        }
        .rbc-event {
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .rbc-btn-group button {
          border: 1px solid #e4e4e7;
          color: #52525b;
          background: white;
          font-weight: 500;
          padding: 6px 12px;
        }
        .rbc-btn-group button.rbc-active {
          background: #f4f4f5;
          box-shadow: none;
        }
        .rbc-btn-group button:hover {
          background: #fafafa;
        }
        .rbc-toolbar button:active, .rbc-toolbar button.rbc-active:active, .rbc-toolbar button.rbc-active:hover, .rbc-toolbar button.rbc-active:focus {
          background-color: #f4f4f5;
          box-shadow: none;
        }
        .rbc-toolbar {
          margin-bottom: 16px;
        }
        .rbc-toolbar-label {
          font-weight: 600;
          font-size: 16px;
        }
      `}} />
    </div>
  );
}
