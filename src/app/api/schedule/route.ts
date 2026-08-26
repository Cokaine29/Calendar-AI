import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getToken } from 'next-auth/jwt';

export async function POST(request: Request) {
    try {
        // Need to get the access token from the session/token securely on the backend
        // We can pass the request to getToken to retrieve the token established by next-auth
        const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
        
        if (!token || !token.accessToken) {
             return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
        }

        const body = await request.json();
        const { events } = body;

        if (!events || !Array.isArray(events)) {
            return NextResponse.json({ error: 'Expected an array of events' }, { status: 400 });
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ access_token: token.accessToken as string });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        const results = [];
        
        for (const ev of events) {
            const eventPayload = {
                summary: ev.title || 'New Event',
                location: ev.location || '',
                description: ev.description || '',
                start: {
                    dateTime: ev.start_time
                },
                end: {
                    dateTime: ev.end_time
                }
            };
            
            console.log("Scheduling event payload:", eventPayload);
            
            const res = await calendar.events.insert({
                calendarId: 'primary',
                requestBody: eventPayload
            });
            
            console.log("Google API response status:", res.status);
            
            if (res.data && res.data.htmlLink) {
                console.log("Event created successfully:", res.data.htmlLink);
                results.push({
                    title: eventPayload.summary,
                    link: res.data.htmlLink
                });
            } else {
                console.log("Google API succeeded but returned no htmlLink:", res.data);
            }
        }

        console.log("Returning results to client:", results);
        return NextResponse.json({ success: true, links: results });
        
    } catch (error: any) {
        console.error("Scheduling error details:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
