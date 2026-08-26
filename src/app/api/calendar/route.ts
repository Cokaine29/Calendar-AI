import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getToken } from 'next-auth/jwt';

export async function GET(request: Request) {
    try {
        const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
        
        if (!token || !token.accessToken) {
             return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ access_token: token.accessToken as string });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        // Fetch events from now to 7 days from now
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);

        const res = await calendar.events.list({
            calendarId: 'primary',
            timeMin: now.toISOString(),
            timeMax: nextWeek.toISOString(),
            maxResults: 50,
            singleEvents: true,
            orderBy: 'startTime',
        });
        
        const events = res.data.items || [];
        
        // Map to a cleaner format
        const formattedEvents = events.map(ev => ({
            id: ev.id,
            title: ev.summary || 'Busy',
            start: ev.start?.dateTime || ev.start?.date,
            end: ev.end?.dateTime || ev.end?.date,
            isAllDay: !!ev.start?.date,
            htmlLink: ev.htmlLink
        }));

        return NextResponse.json({ success: true, events: formattedEvents });
        
    } catch (error: any) {
        console.error("Calendar fetch error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch calendar" }, { status: 500 });
    }
}
