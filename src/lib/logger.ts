type LogLevel = "info" | "warn" | "error" | "debug";

const PII_PATTERNS = [
  /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Name-like patterns
  /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g, // Emails
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // Phone numbers
];

function sanitize(value: unknown): unknown {
  if (typeof value === "string") {
    // Do not sanitize short non-PII strings like IDs or status codes
    if (value.length > 50) {
      return "[REDACTED]";
    }
    return value;
  }
  if (value && typeof value === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      // Redact known PII fields by key name
      if (
        ["rawInput", "raw_input", "parsedResume", "parsed_resume", "name", "email", "phone", "address"].includes(k)
      ) {
        sanitized[k] = "[REDACTED]";
      } else {
        sanitized[k] = sanitize(v);
      }
    }
    return sanitized;
  }
  return value;
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta: sanitize(meta) } : {}),
  };

  const output = JSON.stringify(entry);

  switch (level) {
    case "error":
      console.error(output);
      break;
    case "warn":
      console.warn(output);
      break;
    case "debug":
      if (process.env.NODE_ENV !== "production") {
        console.debug(output);
      }
      break;
    default:
      console.log(output);
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) =>
    log("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) =>
    log("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) =>
    log("error", message, meta),
  debug: (message: string, meta?: Record<string, unknown>) =>
    log("debug", message, meta),
};
