"use client";

import { TEMPLATE_META, type TemplateSlug } from "@/lib/types";

interface TemplatePickerProps {
  selected: TemplateSlug;
  onSelect: (slug: TemplateSlug) => void;
  onGenerate: () => void;
  loading?: boolean;
  onClose?: () => void;
}

const TEMPLATE_COLORS: Record<TemplateSlug, string> = {
  classic: "#6366f1",
  modern: "#10b981",
  minimal: "#f59e0b",
};

export default function TemplatePicker({
  selected,
  onSelect,
  onGenerate,
  loading,
  onClose,
}: TemplatePickerProps) {
  const slugs: TemplateSlug[] = ["classic", "modern", "minimal"];

  return (
    <div style={{ position: "relative" }}>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: -8,
            right: -8,
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-muted)"
          }}
          aria-label="Close"
        >
          ✕
        </button>
      )}
      <h2
        style={{
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        Choose a template
      </h2>
      <p
        style={{
          textAlign: "center",
          color: "var(--color-text-secondary)",
          marginBottom: 32,
          fontSize: 14,
        }}
      >
        You can switch templates anytime from within the editor.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {slugs.map((slug) => {
          const meta = TEMPLATE_META[slug];
          const color = TEMPLATE_COLORS[slug];
          const isSelected = slug === selected;

          return (
            <button
              key={slug}
              id={`template-${slug}`}
              onClick={() => onSelect(slug)}
              aria-pressed={isSelected}
              style={{
                background: "var(--color-surface-raised)",
                border: `2px solid ${isSelected ? color : "var(--color-border)"}`,
                borderRadius: "var(--radius-lg)",
                padding: 16,
                cursor: "pointer",
                transition: "all 0.15s ease",
                textAlign: "left",
                outline: "none",
                boxShadow: isSelected ? `0 0 0 3px ${color}30` : "none",
              }}
            >
              {/* Mockup */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: "var(--radius-sm)",
                  padding: "12px 10px",
                  marginBottom: 12,
                  height: 100,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "55%",
                    height: 6,
                    background: color,
                    borderRadius: 3,
                    marginBottom: 5,
                  }}
                />
                <div
                  style={{
                    width: "35%",
                    height: 4,
                    background: "#e5e7eb",
                    borderRadius: 3,
                    marginBottom: 12,
                  }}
                />
                {[75, 60, 85, 50].map((w, i) => (
                  <div
                    key={i}
                    style={{
                      width: `${w}%`,
                      height: 3,
                      background: "#e5e7eb",
                      borderRadius: 3,
                      marginBottom: 4,
                    }}
                  />
                ))}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: color,
                    opacity: 0.3,
                  }}
                />
              </div>

              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                {isSelected && (
                  <span style={{ color, marginRight: 4 }}></span>
                )}
                {meta.displayName}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--color-text-muted)",
                }}
              >
                {meta.description}
              </div>
            </button>
          );
        })}
      </div>

      <button
        id="generate-btn"
        className="btn btn-primary"
        onClick={onGenerate}
        disabled={loading}
        style={{
          width: "100%",
          justifyContent: "center",
          padding: "14px",
          fontSize: 16,
        }}
      >
        {loading ? (
          <>
            <div className="spinner" />
            Generating LaTeX…
          </>
        ) : (
          `Generate with ${TEMPLATE_META[selected].displayName}`
        )}
      </button>
    </div>
  );
}
