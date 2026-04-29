import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  console.log("AI ACTION: Reverting to Gemini 3 Flash (Standard)...");
  
  const session = getSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ error: '401: Authentication required' }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: '500: API Key missing' }, { status: 500 });
  }

  try {
    const { prompt } = await req.json();

    // Reverting to the Gemini 3 Flash endpoint
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`;

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ 
            text: `Brainstorm 5 ideas for: ${prompt}. 
            Return ONLY a JSON array of objects.
            Each object must have: 
            - "text": the idea string
            - "category": one of ["Action Item", "Research", "Design"]
            Example: [{"text": "Fix orbital friction", "category": "Action Item"}]` 
          }]
        }],
        generationConfig: {
          temperature: 0.8,
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
    
    const jsonString = text.substring(start, end + 1);
    const ideas = JSON.parse(jsonString);

    return NextResponse.json({ ideas });

  } catch (error: any) {
    console.error("BACKEND CRASH:", error.message);
    
    if (process.env.NODE_ENV === 'development') {
       return NextResponse.json({ 
         ideas: [
           { text: "Fix orbital node snapping logic", category: "Action Item" },
           { text: "Design zero-G glassmorphism sidebar", category: "Design" },
           { text: "Research spatial audio for canvas drift", category: "Research" }
         ] 
       });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}