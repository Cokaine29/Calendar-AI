import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { getToken } from 'next-auth/jwt';

export const maxDuration = 60; // Allow function to run for up to 60 seconds

export async function POST(request: Request) {
    try {
        const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
        if (!token) {
             return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
        }

        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json({ error: 'GROQ_API_KEY is missing from Vercel Environment Variables.' }, { status: 500 });
        }

        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });

        const body = await request.json();
        const { email_text, timezone } = body;

        if (!email_text) {
            return NextResponse.json({ error: 'Email text is required' }, { status: 400 });
        }

        const currentTime = new Date().toISOString();
        const userTz = timezone || 'UTC';
        const prompt = `
        You are an intelligent assistant. I will provide you with the text of an email about an event (like a meeting, workshop, or seminar).
        Your task is to extract the event details. 
        
        The current date and time is: ${currentTime}. The user's timezone is: ${userTz}.
        Use this to accurately resolve any relative dates (e.g. "tomorrow", "next Friday").
        
        Please provide the output as a SINGLE JSON object containing a key called "events". The value of "events" should be a list of event objects. If there are multiple events or sessions mentioned (e.g., Lecture 1, Lecture 2), extract ALL of them as separate objects in the list.
        
        Each event object in the "events" list must have the following keys:
        - title: The name or title of the event (string).
        - start_time: The start date and time in ISO 8601 format (string).
        - end_time: The end date and time in ISO 8601 format (string). If not specified, leave it blank or null.
        - location: The physical location or virtual meeting link (string). If none, use an empty string.
        - description: A brief summary of the event or the context from the email (string).
        
        Respond ONLY with valid JSON.
        
        Email Text:
        ---
        ${email_text}
        ---
        `;

        const response = await groq.chat.completions.create({
            model: 'openai/gpt-oss-120b',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.1
        });

        const jsonResponse = JSON.parse(response.choices[0]?.message?.content || '{}');
        return NextResponse.json(jsonResponse);
        
    } catch (error: any) {
        console.error("Extraction error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
