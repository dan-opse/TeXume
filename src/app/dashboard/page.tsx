import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { resumeSessions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/auth";
import Navbar from "@/components/Navbar";
import { DeleteButton } from "./DeleteButton";
import { FileText, Plus } from "lucide-react";

export const metadata = {
  title: "Dashboard — TeXume",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const resumes = await db
    .select()
    .from(resumeSessions)
    .where(eq(resumeSessions.userId, session.user.id))
    .orderBy(desc(resumeSessions.updatedAt));

  return (
    <>
      <Navbar />
      <main
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "60px 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 48,
          }}
        >
          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 36px)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Your Resumes
          </h1>
          <Link
            href="/build"
            className="btn btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
            }}
          >
            <Plus size={18} />
            <span>New Resume</span>
          </Link>
        </div>

        {resumes.length === 0 ? (
          <div
            className="card"
            style={{
              textAlign: "center",
              padding: "80px 24px",
              background: "var(--color-surface-raised)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "var(--color-surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-text-secondary)",
              }}
            >
              <FileText size={32} />
            </div>
            <div>
              <h3 style={{ fontSize: 20, margin: "0 0 8px 0" }}>No resumes yet</h3>
              <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>
                Get started by parsing your existing resume or pasting text.
              </p>
            </div>
            <Link href="/build" className="btn btn-secondary" style={{ marginTop: 8 }}>
              Create First Resume
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 24,
            }}
          >
            {resumes.map((resume) => {
              // Extract a name if possible
              const parsed = resume.parsedResume as any;
              const name = parsed?.name || "Untitled Resume";
              const templateStr = resume.selectedTemplate || "classic";
              const template =
                templateStr.charAt(0).toUpperCase() +
                templateStr.slice(1);
              const date = new Date(resume.updatedAt).toLocaleDateString(
                undefined,
                { year: "numeric", month: "short", day: "numeric" }
              );

              return (
                <div
                  key={resume.id}
                  className="card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: 24,
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: "0 0 4px 0",
                          fontSize: 18,
                          fontWeight: 600,
                          lineHeight: 1.3,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "200px"
                        }}
                        title={name}
                      >
                        {name}
                      </h3>
                      <div
                        style={{
                          fontSize: 13,
                          color: "var(--color-text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "var(--color-accent)",
                          }}
                        />
                        {template} Template
                      </div>
                    </div>
                    <DeleteButton id={resume.id} />
                  </div>

                  <div style={{ marginTop: "auto" }}>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--color-text-muted)",
                        marginBottom: 16,
                      }}
                    >
                      Last edited: {date}
                    </div>
                    <Link
                      href={`/editor/${resume.id}`}
                      className="btn btn-secondary"
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      Open Editor
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
