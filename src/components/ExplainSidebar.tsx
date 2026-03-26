"use client";

import { useEffect, useRef } from "react";

interface ExplainSidebarProps {
  line: string | null;
  explanation: string | null;
  loading: boolean;
  onClose: () => void;
}

export default function ExplainSidebar({
  line,
  explanation,
  loading,
  onClose,
}: ExplainSidebarProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (line) {
      closeRef.current?.focus();
    }
  }, [line]);

  if (!line) return null;

  return (
    <div
      className="animate-slide-in-right"
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(10,10,15,0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 50,
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        role="complementary"
        aria-label="LaTeX explanation panel"
        aria-live="polite"
        style={{
          width: "100%",
          maxWidth: 380,
          background: "var(--color-surface-raised)",
          borderLeft: "1px solid var(--color-border)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          overflowY: "auto",
          height: "100%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            className="pill pill-accent"
            style={{ fontSize: 12 }}
          >
            💡 Explain Mode
          </span>
          <button
            ref={closeRef}
            id="close-explain-btn"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            aria-label="Close explanation panel"
          >
            ✕
          </button>
        </div>

        {/* Selected line */}
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            Selected code
          </p>
          <code
            style={{
              display: "block",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 12px",
              fontSize: 13,
              fontFamily: "var(--font-mono)",
              color: "var(--color-accent-hover)",
              wordBreak: "break-all",
              whiteSpace: "pre-wrap",
            }}
          >
            {line.trim()}
          </code>
        </div>

        {/* Explanation */}
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            What it does
          </p>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[90, 70, 80].map((w, i) => (
                <div
                  key={i}
                  style={{
                    width: `${w}%`,
                    height: 14,
                    background: "var(--color-border)",
                    borderRadius: 4,
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
              ))}
            </div>
          ) : (
            <p
              style={{
                color: "var(--color-text-secondary)",
                lineHeight: 1.7,
                fontSize: 14,
                margin: 0,
              }}
            >
              {explanation ?? "No explanation available for this line."}
            </p>
          )}
        </div>

        <div
          style={{
            marginTop: "auto",
            padding: "12px",
            background: "var(--color-surface)",
            borderRadius: "var(--radius-md)",
            fontSize: 12,
            color: "var(--color-text-muted)",
          }}
        >
          Click any other line in the editor to explain it.
        </div>
      </div>
    </div>
  );
}
