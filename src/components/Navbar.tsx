"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

interface QuotaData {
  quotas: Array<{ action: string; used: number; limit: number }>;
}

interface NavbarProps {
  sessionId?: string;
}

export default function Navbar({ sessionId }: NavbarProps) {
  const { data: session } = useSession();
  const [quota, setQuota] = useState<QuotaData | null>(null);

  useEffect(() => {
    const params = sessionId ? `?sessionId=${sessionId}` : "";
    fetch(`/api/quota${params}`)
      .then((r) => r.json())
      .then(setQuota)
      .catch(() => null);
  }, [sessionId]);

  const exportQuota = quota?.quotas?.find((q) => q.action === "export_pdf");

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        height: "80px",
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 2px 20px rgba(0,0,0,0.04)",
        borderBottom: "1px solid rgba(0,0,0,0.05)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          textDecoration: "none",
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            background: "var(--color-accent)",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 600,
            color: "#fff",
          }}
        >
          T
        </span>
        <span
          style={{
            fontWeight: 600,
            fontSize: 20,
            color: "var(--color-text-primary)",
            letterSpacing: "-0.04em",
          }}
        >
          TeXume
        </span>
      </Link>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {session ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{ fontSize: 13, color: "var(--color-text-secondary)" }}
            >
              {session.user?.email}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              style={{ borderRadius: 40, padding: "8px 20px" }}
              onClick={() => signOut()}
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            className="btn btn-primary btn-sm"
            style={{ borderRadius: 40, padding: "8px 24px" }}
            onClick={() => signIn()}
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
