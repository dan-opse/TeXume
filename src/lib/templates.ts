import type { ParsedResume, TemplateSlug } from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s?: string | null): string {
  if (!s) return "";
  // Escape special LaTeX characters
  return String(s)
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

function dateRange(start?: string, end?: string): string {
  const s = start ?? "";
  const e = end ?? "Present";
  if (!s) return e;
  return `${s} -- ${e}`;
}

function shortUrl(url?: string | null): string {
  if (!url) return "";
  return String(url).replace(/^https?:\/\/(www\.)?/, "");
}

// ─── Section builders ─────────────────────────────────────────────────────────

function buildExperience(
  exp: ParsedResume["experience"],
  template: TemplateSlug
): string {
  if (!exp || exp.length === 0) return "";

  return exp
    .map((job) => {
      const bullets = job.bullets
        .map((b) => `      \\resumeItem{${esc(b)}}`)
        .join("\n");

      if (template === "modern" || template === "minimal") {
        return `\\entry{${esc(job.company)}}{${dateRange(job.startDate, job.endDate)}}{${esc(job.location ?? "")}}{${esc(job.title)}}
\\resumeItemListStart
${bullets}
\\resumeItemListEnd`;
      }

      return `\\resumeSubheading
      {${esc(job.company)}}{${esc(job.location ?? "")}}
      {${esc(job.title)}}{${dateRange(job.startDate, job.endDate)}}
      \\resumeItemListStart
${bullets}
      \\resumeItemListEnd`;
    })
    .join("\n\n");
}

function buildEducation(
  edu: ParsedResume["education"],
  template: TemplateSlug
): string {
  if (!edu || edu.length === 0) return "";

  return edu
    .map((e) => {
      const degree = e.field ? `${e.degree} in ${e.field}` : e.degree;
      const gpaNote = e.gpa ? `GPA: ${esc(e.gpa)}` : "";

      if (template === "modern" || template === "minimal") {
        return `\\entry{${esc(e.institution)}}{${dateRange(e.startDate, e.endDate)}}{${esc(e.location ?? "")}}{${esc(degree)}${gpaNote ? ` \\quad ${gpaNote}` : ""}}`;
      }

      return `\\resumeSubheading
      {${esc(e.institution)}}{${esc(e.location ?? "")}}
      {${esc(degree)}}{${dateRange(e.startDate, e.endDate)}}`;
    })
    .join("\n\n");
}

function buildProjects(
  projects: ParsedResume["projects"],
  template: TemplateSlug
): string {
  if (!projects || projects.length === 0) return "";

  return projects
    .map((p) => {
      const tech = p.technologies ? p.technologies.join(", ") : "";
      const bullets = p.bullets
        .map((b) => `      \\resumeItem{${esc(b)}}`)
        .join("\n");

      if (template === "modern") {
        return `\\projectentry{${esc(p.name)}}{${esc(tech)}}{}
\\resumeItemListStart
${bullets}
\\resumeItemListEnd`;
      }

      const header =
        template === "minimal"
          ? `\\textbf{${esc(p.name)}}${tech ? ` \\textit{${esc(tech)}}` : ""}`
          : `\\textbf{${esc(p.name)}} $|$ \\emph{${esc(tech)}}`;

      return `\\resumeProjectHeading
          {${header}}{}
      \\resumeItemListStart
${bullets}
      \\resumeItemListEnd`;
    })
    .join("\n\n");
}

function buildSkills(
  skills: ParsedResume["skills"],
  template: TemplateSlug
): string {
  if (!skills || Object.keys(skills).length === 0) return "";

  const entries = Object.entries(skills)
    .map(([category, items]) => {
      const itemList = items.map(esc).join(", ");
      if (template === "minimal") {
        return `\\textbf{${esc(category)}}: ${itemList}`;
      }
      return `\\textbf{${esc(category)}:} ${itemList}`;
    });

  if (template === "minimal") {
    return entries.join(" \\quad ");
  }

  return entries.map((e) => `     \\textbf{${e.split(":")[0].replace("\\textbf{", "").replace("}", "")}:} ${e.split(": ").slice(1).join(": ")} \\\\\n`).join("");
}

// ─── Main generator ───────────────────────────────────────────────────────────

export async function generateLatex(
  parsed: ParsedResume,
  templateSlug: TemplateSlug
): Promise<string> {
  const templatePath = `src/templates/${templateSlug}/main.tex`;
  const fs = await import("fs/promises");
  const path = await import("path");
  const fullPath = path.join(process.cwd(), templatePath);

  let source = await fs.readFile(fullPath, "utf-8");

  const contact = parsed.contact;

  // Replace contact tokens
  source = source
    .replace(/\{\{NAME\}\}/g, esc(parsed.name))
    .replace(/\{\{PHONE\}\}/g, esc(contact.phone ?? ""))
    .replace(/\{\{EMAIL\}\}/g, esc(contact.email ?? ""))
    .replace(/\{\{LINKEDIN\}\}/g, esc(contact.linkedin ?? ""))
    .replace(
      /\{\{LINKEDIN_DISPLAY\}\}/g,
      esc(shortUrl(contact.linkedin ?? ""))
    )
    .replace(/\{\{GITHUB\}\}/g, esc(contact.github ?? ""))
    .replace(/\{\{GITHUB_DISPLAY\}\}/g, esc(shortUrl(contact.github ?? "")))
    .replace(/\{\{WEBSITE\}\}/g, esc(contact.website ?? ""))
    .replace(/\{\{LOCATION\}\}/g, esc(contact.location ?? ""));

  // Handle {{#if X}}...{{/if}} blocks
  source = source.replace(
    /\{\{#if ([A-Z_]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, key, content) => {
      const fieldMap: Record<string, string> = {
        PHONE: contact.phone ?? "",
        EMAIL: contact.email ?? "",
        LINKEDIN: contact.linkedin ?? "",
        GITHUB: contact.github ?? "",
        WEBSITE: contact.website ?? "",
        PROJECTS:
          parsed.projects && parsed.projects.length > 0 ? "yes" : "",
      };
      return fieldMap[key] ? content : "";
    }
  );

  // Replace section entries
  source = source
    .replace(/\{\{EXPERIENCE_ENTRIES\}\}/g, buildExperience(parsed.experience, templateSlug))
    .replace(/\{\{EDUCATION_ENTRIES\}\}/g, buildEducation(parsed.education, templateSlug))
    .replace(
      /\{\{PROJECT_ENTRIES\}\}/g,
      buildProjects(parsed.projects, templateSlug)
    )
    .replace(/\{\{SKILLS_ENTRIES\}\}/g, buildSkills(parsed.skills, templateSlug));

  return source;
}
