import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getToken } from 'next-auth/jwt';

export const dynamic = 'force-dynamic';

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
        
        const { searchParams } = new URL(request.url);
        const reqTimeMin = searchParams.get('timeMin');
        const reqTimeMax = searchParams.get('timeMax');

        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);

        const timeMin = reqTimeMin || now.toISOString();
        const timeMax = reqTimeMax || nextWeek.toISOString();

        const res = await calendar.events.list({
            calendarId: 'primary',
            timeMin: timeMin,
            timeMax: timeMax,
            maxResults: 250,
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
