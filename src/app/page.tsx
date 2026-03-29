import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { HeroSection } from "@/components/ui/hero-4";
import BorderGlow from "@/components/ui/BorderGlow";

export const metadata: Metadata = {
  title: "TeXume — Professional LaTeX Resume Builder",
  description:
    "Turn any resume into a beautifully typeset LaTeX resume in under 2 minutes. Live split-pane editor, Explain Mode, 3 curated templates.",
};

const templates = [
  {
    slug: "classic",
    name: "Classic Academic",
    description: "Serif elegance, ruled sections",
    color: "#6366f1",
  },
  {
    slug: "modern",
    name: "Modern Tech",
    description: "Accent color, compact, fresh",
    color: "#10b981",
  },
  {
    slug: "minimal",
    name: "Minimal Clean",
    description: "Whitespace-first, zero clutter",
    color: "#f59e0b",
  },
];

const steps = [
  {
    num: "01",
    title: "Paste or Upload",
    desc: "Drop in plain text, a PDF, or a DOCX. Our AI extracts every detail instantly.",
  },
  {
    num: "02",
    title: "Pick a Template",
    desc: "Choose from three professionally crafted LaTeX templates — all ATS-friendly.",
  },
  {
    num: "03",
    title: "Edit & Export",
    desc: "Fine-tune in the split-pane editor, click any line to understand it, then download.",
  },
];

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* ─── Hero ─────────────────────────────────────────────────────────── */}
        <HeroSection
          title={<>Your LaTeX resume,<br /></>}
          animatedTexts={[
            "in minutes.",
            "compiled instantly.",
            "with zero errors.",
            "beautifully typeset."
          ]}
          subtitle="The professional standard of LaTeX, simplified for the modern career. No syntax errors, just pure typographic excellence."
          infoBadgeText="Precision in every line"
          ctaButtonText="Build My Resume"
          socialProofText="Loved by academics & engineers"
          avatars={[
            { src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150", alt: "User 1", fallback: "U" },
            { src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150", alt: "User 2", fallback: "E" },
            { src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150", alt: "User 3", fallback: "A" }
          ]}
        />

        {/* ─── Template Preview ──────────────────────────────────────────────── */}
        <section
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            padding: "0 24px 100px",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              fontSize: "clamp(28px, 4vw, 36px)",
              marginBottom: 16,
              fontWeight: 400,
              letterSpacing: "-0.02em",
            }}
          >
            Masterfully crafted templates.
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "var(--color-text-secondary)",
              marginBottom: 48,
            }}
          >
            Switch between templates instantly — your content travels with you.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {templates.map((t) => (
              <div
                key={t.slug}
                className="card"
                style={{ cursor: "pointer", position: "relative", overflow: "hidden" }}
              >
                {/* Preview mockup */}
                <div
                  style={{
                    background: "var(--color-surface-raised)",
                    borderRadius: "var(--radius-md)",
                    padding: "20px 16px",
                    marginBottom: 16,
                    minHeight: 160,
                    border: "1px solid var(--color-border-subtle)",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: "60%",
                      height: 8,
                      background: t.color,
                      borderRadius: 4,
                      marginBottom: 6,
                    }}
                  />
                  <div
                    style={{
                      width: "40%",
                      height: 5,
                      background: "var(--color-border)",
                      borderRadius: 4,
                      marginBottom: 16,
                    }}
                  />
                  {[80, 65, 90, 55, 75].map((w, i) => (
                    <div
                      key={i}
                      style={{
                        width: `${w}%`,
                        height: 3,
                        background: "var(--color-border)",
                        borderRadius: 4,
                        marginBottom: 5,
                        opacity: 0.6,
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
                      background: t.color,
                      opacity: 0.4,
                    }}
                  />
                </div>

                <h3
                  style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}
                >
                  {t.name}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--color-text-secondary)",
                    margin: 0,
                  }}
                >
                  {t.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── How it works ─────────────────────────────────────────────────── */}
        <section
          id="how-it-works"
          style={{
            maxWidth: 800,
            margin: "0 auto",
            padding: "0 24px 100px",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 200,
              letterSpacing: "-0.04em",
              marginBottom: 16,
            }}
          >
            Three steps to perfection.
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "var(--color-text-secondary)",
              marginBottom: 56,
            }}
          >
            From paste to PDF in under 2 minutes.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {steps.map((step, i) => (
              <BorderGlow
                key={i}
                glowColor="213 100 50"
                backgroundColor="#ffffff"
                colors={["#0066cc", "#3399ff", "#60a5fa"]}
                borderRadius={20}
                glowRadius={48}
                glowIntensity={1.2}
                edgeSensitivity={20}
                coneSpread={30}
                fillOpacity={0.12}
                style={{ width: "100%" }}
              >
                <div
                  style={{ display: "flex", gap: 24, alignItems: "flex-start", padding: "28px 32px" }}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      width: 48,
                      height: 48,
                      borderRadius: "var(--radius-md)",
                      background: "var(--color-accent-muted)",
                      border: "1px solid var(--color-accent-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 13,
                      color: "var(--color-accent-hover)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {step.num}
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: 18,
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      {step.title}
                    </h3>
                    <p
                      style={{
                        color: "var(--color-text-secondary)",
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {step.desc}
                    </p>
                  </div>
                </div>
              </BorderGlow>
            ))}
          </div>
        </section>

        {/* ─── Explain Mode callout ─────────────────────────────────────────── */}
        <section
          style={{
            maxWidth: 700,
            margin: "0 auto",
            padding: "0 24px 120px",
            textAlign: "center",
          }}
        >
          <div
            className="card"
            style={{
              background: "var(--color-surface-raised)",
              borderColor: "var(--color-accent-border)",
            }}
          >
            <div
              style={{
                fontSize: 36,
                marginBottom: 16,
              }}
            >
              💡
            </div>
            <h2
              style={{ fontSize: 28, fontWeight: 400, marginBottom: 12, letterSpacing: "-0.02em" }}
            >
              Explain Mode — learn LaTeX as you go
            </h2>
            <p
              style={{
                color: "var(--color-text-secondary)",
                lineHeight: 1.7,
                marginBottom: 24,
              }}
            >
              Click any line in the editor and get a plain-English explanation
              of what that LaTeX command does. TeXume is the only resume builder
              that teaches you the source while you use it.
            </p>
            <Link href="/build" className="btn btn-primary">
              Try Explain Mode →
            </Link>
          </div>
        </section>


        {/* ─── Footer ───────────────────────────────────────────────────────── */}
        <footer
          style={{
            borderTop: "1px solid var(--color-border-subtle)",
            padding: "32px 24px",
            textAlign: "center",
            color: "var(--color-text-muted)",
            fontSize: 13,
          }}
        >
          <p style={{ margin: 0 }}>
            © {new Date().getFullYear()} TeXume · Built with ❤️ and LaTeX ·{" "}
            <Link
              href="/privacy"
              style={{ color: "var(--color-text-muted)", textDecoration: "underline" }}
            >
              Privacy
            </Link>
          </p>
        </footer>
      </main>
    </>
  );
}
