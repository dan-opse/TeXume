import { NextRequest, NextResponse } from "next/server";
import { getFlashModel } from "@/lib/gemini";
import { checkRateLimit, explainRatelimit } from "@/lib/ratelimit";
import { explainSchema } from "@/lib/validators/explain.validator";
import { logger } from "@/lib/logger";

// Common LaTeX command dictionary for instant responses
const COMMAND_DICT: Record<string, string> = {
  "\\documentclass": "Sets the overall document type (e.g. article, report) and paper/font size options.",
  "\\usepackage": "Loads a LaTeX package that adds extra features or commands.",
  "\\begin{document}": "Marks the start of the document content (everything before is the preamble/setup).",
  "\\end{document}": "Marks the end of the document. Nothing after this is rendered.",
  "\\section": "Creates a new major section heading.",
  "\\subsection": "Creates a sub-section heading, one level below \\section.",
  "\\textbf": "Makes the enclosed text bold.",
  "\\textit": "Makes the enclosed text italic.",
  "\\emph": "Emphasises text — usually italics, but adapts to context.",
  "\\vspace": "Adds vertical space. The argument sets how much (e.g. 0.5em = half a capital-letter height).",
  "\\hspace": "Adds horizontal space.",
  "\\newline": "Breaks the current line and starts a new one.",
  "\\\\": "Line break — starts a new line within a paragraph or table.",
  "\\item": "Marks a single bullet point inside a list environment.",
  "\\begin{itemize}": "Starts an unordered (bullet) list.",
  "\\begin{enumerate}": "Starts an ordered (numbered) list.",
  "\\href": "Creates a clickable hyperlink. First argument is the URL, second is the display text.",
  "\\color": "Changes the text colour to the specified colour name.",
  "\\definecolor": "Defines a new custom colour with a name and RGB/hex value.",
  "\\titleformat": "Customises how a heading level (section, subsection, etc.) looks.",
  "\\setlength": "Changes a length dimension, like margin size or line spacing.",
  "\\addtolength": "Adds to (or subtracts from) a length setting.",
  "\\pagestyle": "Sets how headers and footers appear on pages.",
  "\\fancyhf": "Clears all header/footer fields when using the fancyhdr package.",
  "\\renewcommand": "Redefines an existing command with a new definition.",
  "\\newcommand": "Defines a brand-new custom command.",
  "\\resumeSubheading": "Custom TeXume command: creates a formatted job/education entry with company, location, title, and dates.",
  "\\resumeItem": "Custom TeXume command: adds a single bullet point in a resume list.",
  "\\resumeItemListStart": "Custom TeXume command: begins a list of resume bullet points.",
  "\\resumeItemListEnd": "Custom TeXume command: ends a list of resume bullet points.",
};

function findDictMatch(line: string): string | null {
  for (const [cmd, explanation] of Object.entries(COMMAND_DICT)) {
    if (line.includes(cmd)) return explanation;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "anonymous";
    const { success } = await checkRateLimit(explainRatelimit, ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = explainSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request." },
        { status: 400 }
      );
    }

    const { line, context } = parsed.data;

    // Try dictionary first
    const dictMatch = findDictMatch(line);
    if (dictMatch) {
      return NextResponse.json({ explanation: dictMatch });
    }

    // Fall back to Gemini
    const model = getFlashModel();
    const prompt = `You are a friendly LaTeX tutor. Explain this LaTeX code in 1-2 plain English sentences.
Focus on what the command DOES visually or structurally in a resume context.
Be specific about the arguments if present.
Do NOT use technical jargon or reference other packages.

${context ? `Document context: ${context}\n` : ""}
LaTeX code: ${line}

Explanation:`;

    const result = await model.generateContent(prompt);
    const explanation = result.response.text().trim();

    return NextResponse.json({ explanation });
  } catch (err) {
    logger.error("Explain endpoint error", { error: String(err) });
    return NextResponse.json(
      { error: "Something went wrong. Try again shortly." },
      { status: 500 }
    );
  }
}
