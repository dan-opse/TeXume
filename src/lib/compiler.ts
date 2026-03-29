import { logger } from "@/lib/logger";

const TECTONIC_URL =
  process.env.TECTONIC_API_URL ?? "http://localhost:9292";

/**
 * Compile a LaTeX string to PDF using the Tectonic Docker sidecar.
 * Returns the compiled PDF as a Buffer.
 */
export async function compile(latex: string): Promise<Buffer> {
  const url = `${TECTONIC_URL}/compile`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source: latex }),
    signal: AbortSignal.timeout(60_000), // 60s timeout for first-time package downloads
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "unknown error");
    logger.error("Tectonic compilation failed", {
      status: response.status,
      body: body.slice(0, 200),
    });

    // Parse line number if available (e.g. from "main.tex:15: Undefined control sequence")
    const lineMatch = body.match(/(?:line |\.tex:)(\d+)/i);
    const lineNum = lineMatch ? lineMatch[1] : null;

    throw new CompileError(
      lineNum
        ? `There's a syntax issue in your LaTeX — check line ${lineNum}.`
        : "There's a syntax issue in your LaTeX — check the highlighted area.",
      lineNum ? parseInt(lineNum) : undefined,
      body
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export class CompileError extends Error {
  public readonly lineNumber?: number;
  public readonly rawError: string;

  constructor(message: string, lineNumber?: number, rawError = "") {
    super(message);
    this.name = "CompileError";
    this.lineNumber = lineNumber;
    this.rawError = rawError;
  }
}
