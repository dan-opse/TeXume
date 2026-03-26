// ─── Template Slugs ───────────────────────────────────────────────────────────

export type TemplateSlug = "classic" | "modern" | "minimal";

export const TEMPLATE_SLUGS: TemplateSlug[] = ["classic", "modern", "minimal"];

export const TEMPLATE_META: Record<
  TemplateSlug,
  { displayName: string; description: string }
> = {
  classic: {
    displayName: "Classic Academic",
    description: "Timeless single-column layout with serif elegance",
  },
  modern: {
    displayName: "Modern Tech",
    description: "Clean sans-serif with a colored accent stripe",
  },
  minimal: {
    displayName: "Minimal Clean",
    description: "Whitespace-first, zero decoration, maximum clarity",
  },
};

// ─── User / Auth ──────────────────────────────────────────────────────────────

export type ActionType = "generate" | "export_pdf" | "export_zip";

// ─── Resume Data ──────────────────────────────────────────────────────────────

export interface ContactInfo {
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface WorkExperience {
  company: string;
  location?: string;
  title: string;
  startDate: string;
  endDate?: string; // undefined = "Present"
  bullets: string[];
}

export interface Education {
  institution: string;
  location?: string;
  degree: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  notes?: string[];
}

export interface Project {
  name: string;
  url?: string;
  technologies?: string[];
  bullets: string[];
}

export interface ParsedResume {
  name: string;
  contact: ContactInfo;
  summary?: string;
  experience: WorkExperience[];
  education: Education[];
  skills: Record<string, string[]>; // category -> list of skills
  projects?: Project[];
  certifications?: string[];
  languages?: string[];
}

// ─── API Shapes ───────────────────────────────────────────────────────────────

export interface ConvertResponse {
  sessionId: string;
  parsed: ParsedResume;
}

export interface GenerateResponse {
  latex: string;
}

export interface CompileResponse {
  pdfUrl: string;
}

export interface ExplainResponse {
  explanation: string;
}

// ─── Quota ────────────────────────────────────────────────────────────────────

export interface QuotaStatus {
  action: ActionType;
  used: number;
  limit: number;
  remaining: number;
  isAtLimit: boolean;
}

// ─── Error shapes ─────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code?: string;
}
