"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import {
  EditorState,
  type StateEffect,
} from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { StreamLanguage } from "@codemirror/language";
import { stex } from "@codemirror/legacy-modes/mode/stex";
import Navbar from "@/components/Navbar";
import TemplatePicker from "@/components/TemplatePicker";
import ExplainSidebar from "@/components/ExplainSidebar";

import type { TemplateSlug } from "@/lib/types";

interface SessionData {
  id: string;
  selectedTemplate: TemplateSlug;
  latexSource: string | null;
  parsedResume: unknown;
}

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "1";

  const [session, setSession] = useState<SessionData | null>(null);
  const [latex, setLatex] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);

  // Template picker state
  const [showPicker, setShowPicker] = useState(isNew);
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateSlug>("classic");
  const [generating, setGenerating] = useState(false);

  // Explain Mode state
  const [explainEnabled, setExplainEnabled] = useState(false);
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);



  // Editor refs
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Load session ────────────────────────────────────────────────────────

  useEffect(() => {
    fetch(`/api/sessions/${id}`)
      .then((r) => r.json())
      .then((data: SessionData) => {
        setSession(data);
        setSelectedTemplate(data.selectedTemplate ?? "classic");
        if (data.latexSource) {
          setLatex(data.latexSource);
        }
        // If no latex yet and not new, mark as new to show picker
        if (!data.latexSource && !isNew) {
          setShowPicker(true);
        }
      })
      .catch(() => {});
  }, [id, isNew]);

  // ─── Init CodeMirror ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!editorContainerRef.current || editorViewRef.current) return;

    const view = new EditorView({
      state: EditorState.create({
        doc: latex,
        extensions: [
          lineNumbers(),
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
          StreamLanguage.define(stex),
          highlightSelectionMatches(),
          EditorView.theme({
            "&": {
              height: "100%",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              background: "#ffffff",
              color: "#1d1d1f"
            },
            ".cm-scroller": {
              overflow: "auto",
            },
            ".cm-content": {
              padding: "16px 0",
            },
            ".cm-focused": {
              outline: "none",
            },
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const newLatex = update.state.doc.toString();
              setLatex(newLatex);

              // Debounce compile
              if (debounceRef.current) clearTimeout(debounceRef.current);
              debounceRef.current = setTimeout(() => {
                triggerCompile(newLatex);
              }, 500);
            }
          }),
          // Explain Mode click handler
          EditorView.domEventHandlers({
            click(event, view) {
              if (!explainEnabled) return;
              const pos = view.posAtCoords({
                x: (event as MouseEvent).clientX,
                y: (event as MouseEvent).clientY,
              });
              if (pos == null) return;
              const line = view.state.doc.lineAt(pos);
              if (line.text.trim()) {
                handleExplain(line.text);
              }
            },
          }),
        ],
      }),
      parent: editorContainerRef.current,
    });

    editorViewRef.current = view;

    return () => {
      view.destroy();
      editorViewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorContainerRef, showPicker]);

  // Update editor content when latex changes externally
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;
    const currentContent = view.state.doc.toString();
    if (currentContent !== latex && latex) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: latex,
        },
      });
    }
  }, [latex]);

  // Update click handler when explainEnabled changes
  // (Recreated through the updateListener since we capture in closure)

  // ─── Compile ─────────────────────────────────────────────────────────────

  const triggerCompile = useCallback(
    async (source?: string) => {
      const latexToCompile = source ?? latex;
      if (!latexToCompile || !id) return;

      setCompiling(true);
      setCompileError(null);

      try {
        const res = await fetch("/api/compile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: id,
            latex: latexToCompile,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setCompileError(data.error ?? "Compilation failed.");
          if (res.status === 503) {
            setCompileError(
              "Couldn't reach the compilation server — check your connection and try again."
            );
          }
          return;
        }

        setPdfUrl(data.pdfUrl);
      } catch {
        setCompileError(
          "Couldn't reach the server — check your connection and try again."
        );
      } finally {
        setCompiling(false);
      }
    },
    [id, latex]
  );

  // Compile when latex is first loaded
  useEffect(() => {
    if (latex && !pdfUrl && !showPicker) {
      triggerCompile(latex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latex, showPicker]);

  // ─── Generate (after template pick) ──────────────────────────────────────

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: id,
          templateSlug: selectedTemplate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "QUOTA_EXCEEDED") {
          alert(data.error);
        }
        return;
      }

      setLatex(data.latex);
      setShowPicker(false);
      // Compile will trigger via useEffect
    } finally {
      setGenerating(false);
    }
  };

  // ─── Explain Mode ────────────────────────────────────────────────────────

  const handleExplain = async (line: string) => {
    setSelectedLine(line);
    setExplanation(null);
    setExplaining(true);

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line }),
      });
      const data = await res.json();
      setExplanation(data.explanation ?? null);
    } catch {
      setExplanation("Couldn't fetch explanation. Try again.");
    } finally {
      setExplaining(false);
    }
  };

  const handleExportPdf = async () => {
    const res = await fetch(`/api/export/pdf?sessionId=${id}`);
    if (res.status === 403) {
      const data = await res.json();
      alert(data.error);
      return;
    }
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportZip = async () => {
    const res = await fetch(`/api/export/zip?sessionId=${id}`);
    if (res.status === 403) {
      const data = await res.json();
      alert(data.error);
      return;
    }
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume-source.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── File tree ───────────────────────────────────────────────────────────

  const fileTree = ["main.tex"];

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      <Navbar sessionId={id} />

      {/* Template picker overlay */}
      {showPicker && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--color-bg)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            className="card animate-fade-in"
            style={{ maxWidth: 640, width: "100%", maxHeight: "90vh", overflowY: "auto" }}
          >
            <TemplatePicker
              selected={selectedTemplate}
              onSelect={setSelectedTemplate}
              onGenerate={handleGenerate}
              loading={generating}
            />
          </div>
        </div>
      )}



      {/* Editor toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 24px",
          height: 56,
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border-subtle)",
          overflowX: "auto",
        }}
      >
        {/* Explain toggle */}
        <button
          id="explain-toggle-btn"
          className={`btn btn-sm ${explainEnabled ? "btn-primary" : "btn-secondary"}`}
          onClick={() => {
            setExplainEnabled((e) => !e);
            if (explainEnabled) {
              setSelectedLine(null);
            }
          }}
          aria-pressed={explainEnabled}
          title="Toggle Explain Mode — click any line to understand it"
        >
          💡 Explain {explainEnabled ? "ON" : "OFF"}
        </button>

        <div
          style={{
            width: 1,
            height: 20,
            background: "var(--color-border)",
            margin: "0 4px",
          }}
        />

        {/* Switch template */}
        <button
          id="switch-template-btn"
          className="btn btn-secondary btn-sm"
          onClick={() => setShowPicker(true)}
          title="Switch template"
        >
          🎨 Switch Template
        </button>

        <div style={{ flex: 1 }} />

        {/* Compile indicator */}
        {compiling && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div className="spinner" style={{ width: 14, height: 14 }} />
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              Compiling…
            </span>
          </div>
        )}

        {compileError && !compiling && (
          <span
            style={{ fontSize: 12, color: "var(--color-error)", maxWidth: 200 }}
            title={compileError}
          >
            ⚠ Compile error
          </span>
        )}

        {/* Export buttons */}
        <button
          id="download-pdf-btn"
          className="btn btn-secondary btn-sm"
          onClick={handleExportPdf}
          aria-label="Download compiled PDF"
        >
          ⬇ PDF
        </button>
        <button
          id="download-zip-btn"
          className="btn btn-secondary btn-sm"
          onClick={handleExportZip}
          aria-label="Download LaTeX source ZIP"
        >
          ⬇ Source .zip
        </button>
      </div>

      {/* Three-panel editor layout */}
      <div
        style={{
          height: "calc(100vh - 80px - 56px)",
          overflow: "hidden",
          position: "relative",
          background: "var(--color-bg)",
          padding: "16px",
        }}
      >
        <PanelGroup direction="horizontal" style={{ height: "100%", gap: 16 }}>
          {/* File tree panel */}
          <Panel
            defaultSize={12}
            minSize={8}
            maxSize={20}
            style={{
              background: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border-subtle)",
              overflow: "auto",
              boxShadow: "var(--shadow-sm)"
            }}
          >
            <div style={{ padding: "12px 8px" }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--color-text-muted)",
                  marginBottom: 8,
                  padding: "0 8px",
                }}
              >
                Files
              </p>
              {fileTree.map((file) => (
                <div
                  key={file}
                  style={{
                    padding: "6px 8px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 13,
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-accent-hover)",
                    background: "var(--color-accent-muted)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                  onClick={() => {}}
                >
                  <span style={{ opacity: 0.6 }}>📄</span>
                  {file}
                </div>
              ))}
            </div>
          </Panel>

          <PanelResizeHandle
            style={{
              width: 8,
              cursor: "col-resize",
            }}
          />

          {/* CodeMirror editor panel */}
          <Panel
            defaultSize={44}
            minSize={25}
            style={{
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              background: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border-subtle)",
              boxShadow: "var(--shadow-sm)"
            }}
          >
            {explainEnabled && (
              <div
                style={{
                  padding: "4px 16px",
                  fontSize: 12,
                  color: "var(--color-accent-hover)",
                  background: "var(--color-accent-muted)",
                  borderBottom: "1px solid var(--color-accent-border)",
                }}
              >
                💡 Click any line to explain it
              </div>
            )}

            <div
              ref={editorContainerRef}
              id="codemirror-editor"
              style={{
                flex: 1,
                overflow: "auto",
                cursor: explainEnabled ? "pointer" : "text",
              }}
            />

            {/* Explain sidebar overlay within editor pane */}
            {explainEnabled && selectedLine && (
              <ExplainSidebar
                line={selectedLine}
                explanation={explanation}
                loading={explaining}
                onClose={() => setSelectedLine(null)}
              />
            )}
          </Panel>

          <PanelResizeHandle
            style={{
              width: 8,
              cursor: "col-resize",
            }}
          />

          {/* PDF preview panel */}
          <Panel
            defaultSize={44}
            minSize={20}
            style={{
              background: "var(--color-surface)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border-subtle)",
              boxShadow: "var(--shadow-sm)"
            }}
          >
            <div
              style={{
                padding: "8px 16px",
                borderBottom: "1px solid var(--color-border-subtle)",
                fontSize: 12,
                color: "var(--color-text-muted)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: compiling
                    ? "var(--color-warning)"
                    : pdfUrl
                    ? "var(--color-success)"
                    : "var(--color-border)",
                }}
              />
              {compiling
                ? "Compiling…"
                : pdfUrl
                ? "PDF Preview"
                : "Waiting to compile"}
            </div>

            <div style={{ flex: 1, position: "relative" }}>
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  title="Resume PDF preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                  }}
                  aria-label="Live PDF preview of your resume"
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    flexDirection: "column",
                    gap: 12,
                    color: "var(--color-text-muted)",
                    textAlign: "center",
                    padding: 24,
                  }}
                >
                  {compileError ? (
                    <>
                      <div style={{ fontSize: 32 }}>⚠️</div>
                      <p style={{ fontSize: 14, color: "var(--color-error)" }}>
                        {compileError}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="spinner" style={{ width: 32, height: 32 }} />
                      <p style={{ fontSize: 13 }}>
                        {generating
                          ? "Generating LaTeX…"
                          : "Waiting for compilation server…"}
                      </p>
                      <p style={{ fontSize: 12 }}>
                        Make sure the Tectonic Docker sidecar is running.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>

        {/* First-visit onboarding tooltip */}
        {latex && !explainEnabled && (
          <div
            className="animate-fade-in"
            style={{
              position: "absolute",
              bottom: 24,
              left: "50%",
              transform: "translateX(-50%)",
              background: "var(--color-surface-overlay)",
              border: "1px solid var(--color-accent-border)",
              borderRadius: "var(--radius-lg)",
              padding: "12px 20px",
              fontSize: 13,
              color: "var(--color-text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              pointerEvents: "none",
              whiteSpace: "nowrap",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <span style={{ color: "var(--color-accent-hover)" }}>💡</span>
            Enable{" "}
            <strong style={{ color: "var(--color-text-primary)" }}>
              Explain Mode
            </strong>{" "}
            in the toolbar to understand any LaTeX line
          </div>
        )}
      </div>
    </>
  );
}
