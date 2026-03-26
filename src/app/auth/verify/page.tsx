import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Check Your Email",
};

export default function VerifyPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        className="card animate-fade-in"
        style={{ width: "100%", maxWidth: 400, textAlign: "center" }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
          Check your email
        </h1>
        <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: 24 }}>
          A sign-in link has been sent to your email address. Click the link to
          continue — it expires in 10 minutes.
        </p>
        <Link href="/" className="btn btn-ghost" style={{ justifyContent: "center" }}>
          ← Back to TeXume
        </Link>
      </div>
    </main>
  );
}
