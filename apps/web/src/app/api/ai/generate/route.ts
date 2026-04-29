import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  console.log("AI ACTION: Initializing Gemini 3.1 Flash-Lite (2026 Stable)...");
  
  let session = getSessionFromRequest(req);
  
  if (!session && process.env.NODE_ENV === 'development') {
    session = { userId: "demo-user", name: "Anas Sheikh", email: "anas@ligma.ai" } as any;
  }

  if (!session) {
    return NextResponse.json({ error: '401: Authentication required' }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: '500: API Key missing' }, { status: 500 });
  }

  try {
    const { prompt } = await req.json();

    // The 2026 model ID is gemini-3.1-flash-lite-preview
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`;

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ 
            text: `Return ONLY a JSON array of 3-6 strings representing brainstorming ideas for: ${prompt}. Example: ["Idea A", "Idea B"]` 
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          // Gemini 3 models support specific thinking levels; 
          // we use 'minimal' for speed on sticky notes.
          thinkingConfig: { thinkingLevel: 'minimal' }
        }
      })
    });

    const data = await res.json();
    
    if (!res.ok) {
      console.error("GOOGLE API ERROR:", data);
      throw new Error(data.error?.message || `Model not found: ${res.status}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Robust JSON Extraction
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    
    if (start === -1 || end === -1) {
      throw new Error("AI failed to return a list format.");
    }
    
    const ideas = JSON.parse(text.substring(start, end + 1));
    return NextResponse.json({ ideas });

  } catch (error: any) {
    console.error("BACKEND CRASH:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}