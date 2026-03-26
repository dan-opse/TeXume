import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: {
    default: "TeXume — LaTeX Resume Builder",
    template: "%s | TeXume",
  },
  description:
    "Turn any resume into a beautifully typeset LaTeX resume in under 2 minutes. Live editor, Explain Mode, multiple templates.",
  keywords: ["latex resume", "resume builder", "latex generator", "cv builder"],
  openGraph: {
    title: "TeXume — LaTeX Resume Builder",
    description:
      "Turn any resume into a beautifully typeset LaTeX resume in under 2 minutes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
