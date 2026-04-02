import { NextRequest, NextResponse } from "next/server";
import { getFlashModel } from "@/lib/gemini";
import { db } from "@/db";
import { resumeSessions } from "@/db/schema";
import { checkRateLimit, convertRatelimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";
import { auth } from "@/auth";
import type { ParsedResume } from "@/lib/types";

// Gemini prompt for resume parsing
const PARSE_PROMPT = `You are a resume parser. Extract structured data from the provided resume text.

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "name": "Full Name",
  "contact": {
    "email": "email@example.com",
    "phone": "+1-555-555-5555",
    "location": "City, State",
    "linkedin": "https://linkedin.com/in/username",
    "github": "https://github.com/username",
    "website": "https://example.com"
  },
  "summary": "Optional brief summary",
  "experience": [
    {
      "company": "Company Name",
      "location": "City, State",
      "title": "Job Title",
      "startDate": "Month Year",
      "endDate": "Month Year or null for current",
      "bullets": ["Accomplished X by doing Y, resulting in Z"]
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "location": "City, State",
      "degree": "B.S.",
      "field": "Computer Science",
      "startDate": "Year",
      "endDate": "Year",
      "gpa": "3.9"
    }
  ],
  "skills": {
    "Languages": ["Python", "TypeScript"],
    "Frameworks": ["React", "Node.js"],
    "Tools": ["Git", "Docker"]
  },
  "projects": [
    {
      "name": "Project Name",
      "url": "https://github.com/...",
      "technologies": ["React", "TypeScript"],
      "bullets": ["Built X that does Y"]
    }
  ]
}

Omit null fields. If a field is missing from the resume, omit it entirely.
Resume text:
`;

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "anonymous";
    const { success } = await checkRateLimit(convertRatelimit, ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute before trying again." },
        { status: 429 }
      );
    }

    const contentType = request.headers.get("content-type") ?? "";
    let resumeText = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const text = formData.get("text") as string | null;

      if (text) {
        resumeText = text;
      } else if (file) {
        // Validate file size
        if (file.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            {
              error:
                "That file is a bit big (max 5 MB). Try a smaller version or paste the text directly.",
            },
            { status: 400 }
          );
        }

        // Validate file type
        const allowedTypes = [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain",
        ];
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json(
            {
              error:
                "We only accept PDF or DOCX files. Try uploading one of those.",
            },
            { status: 400 }
          );
        }

        // For text files, read directly. For PDF/DOCX, send as bytes to Gemini
        if (file.type === "text/plain") {
          resumeText = await file.text();
        } else {
          const bytes = await file.arrayBuffer();
          const base64 = Buffer.from(bytes).toString("base64");
          const model = getFlashModel();
          const result = await model.generateContent([
            {
              inlineData: {
                mimeType: file.type as "application/pdf",
                data: base64,
              },
            },
            PARSE_PROMPT + "(extract from the document above)",
          ]);
          const jsonText = result.response.text().trim();
          const parsed = safeParseResume(jsonText);
          if (!parsed) {
            return NextResponse.json(
              {
                error:
                  "We couldn't read enough from that input. Try pasting your resume as plain text instead.",
              },
              { status: 422 }
            );
          }
          return await saveAndReturn(parsed);
        }
      } else {
        return NextResponse.json(
          { error: "Paste your resume text or upload a file to get started." },
          { status: 400 }
        );
      }
    } else {
      const body = await request.json().catch(() => null);
      if (!body?.text) {
        return NextResponse.json(
          { error: "Paste your resume text or upload a file to get started." },
          { status: 400 }
        );
      }
      resumeText = body.text;
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: "Paste your resume text or upload a file to get started." },
        { status: 400 }
      );
    }

    // Call Gemini to parse
    const model = getFlashModel();
    const result = await model.generateContent(PARSE_PROMPT + resumeText);
    const jsonText = result.response.text().trim();

    const parsed = safeParseResume(jsonText);
    if (!parsed) {
      return NextResponse.json(
        {
          error:
            "We couldn't read enough from that input. Try pasting your resume as plain text instead.",
        },
        { status: 422 }
      );
    }

    return await saveAndReturn(parsed, resumeText);
  } catch (err) {
    logger.error("Convert endpoint error", { error: String(err) });
    return NextResponse.json(
      { error: "Something went wrong on our end. We've been notified." },
      { status: 500 }
    );
  }
}

function safeParseResume(jsonText: string): ParsedResume | null {
  try {
    // Strip markdown code fences if present
    const clean = jsonText
      .replace(/^```json?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();
    const data = JSON.parse(clean);
    if (!data.name || !data.contact) return null;
    return data as ParsedResume;
  } catch {
    return null;
  }
}

async function saveAndReturn(
  parsed: ParsedResume,
  rawInput?: string
): Promise<NextResponse> {
  const session = await auth();
  const userId = session?.user?.id;

  // Calculate expiry: 24 hours from now for anonymous users, permanent for logged-in users
  const expiresAt = userId ? null : new Date(Date.now() + 24 * 60 * 60 * 1000);

  const [resumeSession] = await db
    .insert(resumeSessions)
    .values({
      userId: userId ?? null,
      rawInput: rawInput ?? "[REDACTED]",
      parsedResume: parsed as unknown as Record<string, unknown>,
      selectedTemplate: "classic",
      expiresAt,
    })
    .returning({ id: resumeSessions.id });

  return NextResponse.json({
    sessionId: resumeSession.id,
    parsed,
  });
}
