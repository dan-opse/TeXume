"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const res = await signIn("resend", {
        email,
        redirect: false,
        callbackUrl: "/build",
      });
      if (res?.error) {
        setError("Couldn't send the sign-in email. Please try again.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
        style={{ width: "100%", maxWidth: 400 }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
            marginBottom: 28,
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              background: "var(--color-accent)",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            T
          </span>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.03em" }}>
            TeXume
          </span>
        </Link>

        {sent ? (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
              Check your email
            </h1>
            <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
              We sent a sign-in link to <strong>{email}</strong>. Click the link
              to sign in — it expires in 10 minutes.
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
              Sign in to TeXume
            </h1>
            <p
              style={{
                color: "var(--color-text-secondary)",
                marginBottom: 24,
                fontSize: 14,
              }}
            >
              No password required — we'll email you a sign-in link.
            </p>

            <form onSubmit={handleMagicLink} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label
                  htmlFor="email"
                  style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  aria-label="Email address"
                />
              </div>

              {error && (
                <div role="alert" style={{ color: "#f87171", fontSize: 13 }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                id="magic-link-btn"
                className="btn btn-primary"
                disabled={loading}
                style={{ justifyContent: "center" }}
              >
                {loading ? <><div className="spinner" /> Sending…</> : "Send sign-in link"}
              </button>
            </form>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                margin: "20px 0",
                color: "var(--color-text-muted)",
                fontSize: 13,
              }}
            >
              <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
              or
              <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
            </div>

            <button
              id="google-signin-btn"
              className="btn btn-secondary"
              onClick={() => signIn("google", { callbackUrl: "/build" })}
              style={{ width: "100%", justifyContent: "center" }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </>
        )}
      </div>
    </main>
  );
}
