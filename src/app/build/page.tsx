"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

type Tab = "paste" | "upload";

export default function BuildPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("paste");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConvert = async () => {
    setError(null);

    if (tab === "paste" && !text.trim()) {
      setError("Paste your resume text or upload a file to get started.");
      return;
    }
    if (tab === "upload" && !file) {
      setError("Please select a file to upload.");
      return;
    }

    setLoading(true);

    try {
      let body: FormData | string;
      const options: RequestInit = { method: "POST" };

      if (tab === "paste") {
        options.headers = { "Content-Type": "application/json" };
        body = JSON.stringify({ text });
        options.body = body;
      } else {
        const fd = new FormData();
        fd.append("file", file!);
        body = fd;
        options.body = body;
      }

      const res = await fetch("/api/convert", options);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      // Route to editor — template picker will appear first
      router.push(`/editor/${data.sessionId}?new=1`);
    } catch {
      setError(
        "Couldn't reach the server — check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      validateAndSetFile(dropped);
    }
  };

  const validateAndSetFile = (f: File) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!allowed.includes(f.type)) {
      setError("We only accept PDF or DOCX files. Try uploading one of those.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError(
        "That file is a bit big (max 5 MB). Try a smaller version or paste the text directly."
      );
      return;
    }
    setFile(f);
    setError(null);
  };

  return (
    <>
      <Navbar />
      <main
        style={{
          minHeight: "calc(100vh - 60px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        <div
          className="animate-fade-in"
          style={{ width: "100%", maxWidth: 560 }}
        >
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              marginBottom: 8,
              letterSpacing: "-0.03em",
              textAlign: "center",
            }}
          >
            Start with your resume
          </h1>
          <p
            style={{
              textAlign: "center",
              color: "var(--color-text-secondary)",
              marginBottom: 36,
            }}
          >
            Paste your existing content or upload a file — we'll handle the
            rest.
          </p>

          {/* Tab switcher */}
          <div
            role="tablist"
            style={{
              display: "flex",
              background: "var(--color-surface-raised)",
              borderRadius: "var(--radius-md)",
              padding: 4,
              marginBottom: 20,
              border: "1px solid var(--color-border)",
            }}
          >
            {(["paste", "upload"] as Tab[]).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                id={`tab-${t}`}
                onClick={() => {
                  setTab(t);
                  setError(null);
                }}
                style={{
                  flex: 1,
                  padding: "8px 16px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: "var(--font-sans)",
                  transition: "all 0.15s ease",
                  background:
                    tab === t
                      ? "var(--color-accent)"
                      : "transparent",
                  color:
                    tab === t
                      ? "#fff"
                      : "var(--color-text-secondary)",
                }}
              >
                {t === "paste" ? "📋 Paste Text" : "📁 Upload File"}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div
            role="tabpanel"
            aria-labelledby={`tab-${tab}`}
          >
            {tab === "paste" ? (
              <textarea
                id="resume-text"
                className="input"
                placeholder="Paste your resume here... (plain text, any format)"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={14}
                style={{ resize: "vertical" }}
                aria-label="Resume text"
              />
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="File upload area — click or drag and drop"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    fileInputRef.current?.click();
                  }
                }}
                style={{
                  border: `2px dashed ${dragOver ? "var(--color-accent)" : "var(--color-border)"}`,
                  borderRadius: "var(--radius-lg)",
                  padding: "48px 24px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  background: dragOver
                    ? "var(--color-accent-muted)"
                    : "var(--color-surface-raised)",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) validateAndSetFile(f);
                  }}
                  aria-hidden="true"
                />
                <div style={{ fontSize: 32, marginBottom: 12 }}>
                  {file ? "✅" : "📄"}
                </div>
                {file ? (
                  <>
                    <p style={{ fontWeight: 500, marginBottom: 4 }}>
                      {file.name}
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--color-text-muted)",
                        margin: 0,
                      }}
                    >
                      {(file.size / 1024).toFixed(0)} KB ·{" "}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--color-error)",
                          cursor: "pointer",
                          fontSize: 13,
                        }}
                      >
                        Remove
                      </button>
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ fontWeight: 500, marginBottom: 4 }}>
                      Drop your file here
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--color-text-muted)",
                        margin: 0,
                      }}
                    >
                      PDF or DOCX · max 5 MB · or click to browse
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              style={{
                marginTop: 12,
                padding: "12px 16px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "var(--radius-md)",
                color: "#f87171",
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          {/* CTA */}
          <button
            id="convert-btn"
            className="btn btn-primary"
            onClick={handleConvert}
            disabled={loading}
            style={{
              width: "100%",
              justifyContent: "center",
              marginTop: 16,
              padding: "14px",
              fontSize: 16,
            }}
          >
            {loading ? (
              <>
                <div className="spinner" />
                Parsing your resume…
              </>
            ) : (
              "Convert to LaTeX →"
            )}
          </button>

          <p
            style={{
              textAlign: "center",
              fontSize: 13,
              color: "var(--color-text-muted)",
              marginTop: 12,
            }}
          >
            Your resume is processed server-side and never stored in plaintext.
          </p>
        </div>
      </main>
    </>
  );
}
