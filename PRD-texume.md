# Product Requirements Document (PRD)
> **Template version:** 2.0 — Tailored for Claude Code workflows

---

**Product Name:** TeXume
**Platform:** Web (desktop-first, mobile-readable)
**Owner:** TBD
**Target Completion:** TBD
**Status:** Draft

**SLC Commitment:** This PRD defines an **SLC (Simple, Lovable, Complete) v1.0.0** — *not* an MVP. The release must feel complete, polished, and delightful even with a tight scope. Every shipped feature must be production-quality; nothing half-baked lands in a release.

---

## 0. Quick Reference (For Claude Code)

**Project slug:** `texume`
**One-line goal:** Turn any resume (or raw text) into a beautifully typeset LaTeX resume in under 2 minutes, with a live split-pane editor and click-to-explain LaTeX tooltips.
**Primary language / framework:** TypeScript + Next.js 15 (App Router)
**Key build commands:**
```bash
npm run dev       # start dev server (localhost:3000)
npm run build     # production build
npm run test      # run Vitest suite
npm run lint      # ESLint + tsc --noEmit
```
**Do not touch:** `main` branch (use feature branches), `src/templates/` (LaTeX source files are read-only at runtime — copy before editing)
**Always do:** Use kebab-case for file names. Use Zod for all API input validation. Never expose raw LaTeX compilation errors to the user — map them to friendly messages. All async route handlers must have explicit try/catch.

---

## 1. Overview

TeXume is a web app that converts any resume — uploaded as PDF/DOCX or pasted as plain text — into a polished LaTeX resume using one of three curated templates. Users get a VS Code-style split-pane workspace: a live PDF preview on the right, the raw LaTeX source in a syntax-highlighted editor on the left, and a file tree showing each `.tex` partial. TeXume's signature feature is **Explain Mode**: click any line of LaTeX and a tooltip explains exactly what that command does in plain English — making TeXume the only resume builder that also teaches you LaTeX as you go.

---

## 2. Problem

LaTeX produces the most professional-looking resumes — especially for engineers, academics, and designers — but the barrier to entry is steep. Setting up a TeX environment, finding a good template, and debugging cryptic compile errors takes hours. Existing online builders either hide the LaTeX entirely (no learning, no control) or dump users into a raw Overleaf-style editor with no guidance. There's no tool that meets users in the middle: give me a beautiful result *and* let me understand and own the source.

---

## 3. Motivation

LaTeX resumes are having a resurgence on tech Twitter/X and Reddit (r/cscareerquestions, r/LaTeX). The "I made my resume in LaTeX" post reliably goes viral. The tooling to get there, however, hasn't meaningfully improved in years. This is a personal itch worth scratching — and a sharp enough niche that word-of-mouth can drive early growth without paid acquisition.

---

## 4. Target Users

### Persona 1: Maya, the CS Student
- **Context:** Junior year, applying for internships. Has seen LaTeX resumes on GitHub and wants one but has never touched TeX.
- **Primary pain this solves:** Gets a beautiful LaTeX resume in minutes without installing anything; the Explain Mode demystifies the source so she can tweak it confidently.
- **Success looks like:** Downloads a compiled PDF and the `.tex` source within 5 minutes of landing on the site.

### Persona 2: Jordan, the Mid-Career Engineer
- **Context:** 6 years of experience, switching jobs. Already has a polished Word resume. Wants a typeset LaTeX version to stand out.
- **Primary pain this solves:** Paste-and-go conversion — no retyping. Switch templates with one click to compare looks.
- **Success looks like:** Uploads existing resume → picks template → downloads in under 3 minutes. Zero LaTeX knowledge required.

### Persona 3: Priya, the LaTeX-Curious Academic
- **Context:** PhD student. Writes papers in LaTeX but has never applied it to a resume. Wants full control over the source.
- **Primary pain this solves:** Gets a solid starting template with real structure, then edits the raw `.tex` directly in the editor with syntax highlighting and live recompile.
- **Success looks like:** Spends 20 minutes customising the source in-browser, learns 3 new LaTeX tricks via Explain Mode tooltips, exports a `.zip` of all source files.

---

## 5. Pricing & Access (SLC)

### Limit Tracking
Limits are tracked per anonymous session (localStorage UUID) for unauthenticated users, and per `user_id` in the database for authenticated users. Counts reset on a rolling 30-day window. The current usage count is shown as a subtle pill in the top nav ("2 / 3 exports used").

| Limit | Free | Pro |
|---|---|---|
| Resume generations (AI parse + LaTeX output) | 3 per month | Unlimited |
| Template switches on an existing resume | Unlimited | Unlimited |
| PDF + source `.zip` exports | 3 per month | Unlimited |
| Saved resumes (cloud) | 0 (session only) | 10 |
| Explain Mode tooltips | Unlimited | Unlimited |

### Free (No sign-up required)
- What's included: 3 generations, 3 exports, all 3 templates, Explain Mode, in-browser editing, PDF preview.
- What's excluded: Cloud save (session is ephemeral), unlimited exports. This makes sense — the core experience is fully free; saving and unlimited use rewards signing up.
- Upgrade prompt: Shown as a non-blocking banner at the bottom of the editor after the 2nd export: *"You have 1 free export left this month. Go Pro for unlimited."* On limit hit, a modal with a single clear CTA replaces the export button.

### Pro — $4.99/month or $39/year
- Everything in Free, plus:
  - Unlimited generations and exports
  - Cloud-saved resumes (up to 10 named versions)
  - Priority LaTeX compilation (dedicated queue, faster response)
  - Early access to new templates
- Renewal: Monthly or annual, cancel anytime, no questions asked. Managed via Stripe Billing Portal.

---

## 6. Feature Set

### Must-Have (SLC Core)
| # | Feature | Description | Acceptance Criteria |
|---|---|---|---|
| 1 | Resume Input | Accept plain text paste OR file upload (PDF, DOCX). Parse content into structured JSON (name, contact, experience, education, skills, etc.) using an AI extraction step. | Given a user pastes a resume or uploads a file, when they click "Convert", then the app extracts structured data and populates the editor within 10 seconds. |
| 2 | Template Selection | Present 3 curated LaTeX templates (Classic Academic, Modern Tech, Minimal Clean) as visual card previews before generation. | Given structured data exists, when a user selects a template card, then the LaTeX is generated for that template and the preview renders. |
| 3 | Split-Pane Editor | A three-panel layout: file tree (left), LaTeX source editor with syntax highlighting (centre), live PDF preview (right). Resizable panels. | Given the editor is open, when a user edits the LaTeX source and pauses typing (500ms debounce), then the PDF preview recompiles and updates without a full page reload. |
| 4 | PDF Export | One-click export of the compiled PDF. | Given the PDF has compiled successfully, when the user clicks "Download PDF", then a valid PDF file downloads within 2 seconds. |
| 5 | Source ZIP Export | Export a `.zip` containing all `.tex` partials and any assets (the full compilable project). | Given the editor is open, when the user clicks "Download Source", then a `.zip` with a working LaTeX project downloads. |
| 6 | Explain Mode | Click any line in the LaTeX editor → a tooltip/sidebar panel appears with a plain-English explanation of what that command or block does. Powered by a lightweight AI call or a pre-built command dictionary for common commands. | Given Explain Mode is enabled, when a user clicks a line containing `\vspace{0.5em}`, then a tooltip reads: "Adds 0.5em of vertical space — roughly half the height of a capital letter." |
| 7 | Template Switch | From within the editor, switch between the 3 templates without losing edits to content fields. | Given a resume is loaded, when a user clicks a different template, then the LaTeX regenerates with the new template style but preserves all content data. |

### Should-Have (Next Release — v1.1)
| # | Feature | Description | Notes |
|---|---|---|---|
| 1 | Job Description Tailoring | Paste a job description; the AI highlights which resume bullets are strong matches and suggests one or two additions. | Non-invasive — suggestions, not auto-rewrites. Surfaced as a side panel. |
| 2 | Cloud Save | Authenticated Pro users can name and save up to 10 resume versions, accessible across devices. | Requires auth flow. |
| 3 | Share Link | Generate a read-only shareable link to a compiled resume PDF (useful for sending to recruiters). | No auth required to view the link. |
| 4 | Custom Colour Accents | Let users pick an accent colour (header line, section titles) without touching LaTeX. | A colour picker that injects a `\definecolor` override. |

### Nice-to-Have (Future)
- **Fourth template (Two-Column)** — deferred because 3 templates is SLC-sufficient for launch; adding more dilutes choice without clear demand.
- **LinkedIn import via URL** — blocked on LinkedIn's API restrictions; explore after launch.
- **Overleaf push** — Export directly to a new Overleaf project via their API. Valuable but out of scope for v1.

---

## 7. Core Screens & UX Flow

### Flow 1: First-Time User — Paste & Export
1. User lands on `/` — a clean landing page with a headline, one-paragraph pitch, and a prominent "Build My Resume" CTA.
2. User clicks CTA → routed to `/build`.
3. `/build` shows two tabs: **"Paste Text"** and **"Upload File"**. User pastes their resume text.
4. User clicks "Convert" → loading state ("Parsing your resume…") → on success, routed to `/editor/[session-id]`.
5. Before the editor loads, a full-screen **template picker** (3 cards with preview thumbnails) overlays the screen. User picks one and clicks "Generate".
6. Editor loads: file tree, LaTeX source (syntax-highlighted), live PDF preview. A subtle onboarding tooltip points to Explain Mode ("Click any line to understand it").
7. User makes light edits in the source pane. Preview auto-recompiles.
8. User clicks "Download PDF" → PDF downloads. Export counter decrements.

### Flow 2: Returning User — Template Switch
1. User is in `/editor/[session-id]` with a generated resume.
2. User clicks "Switch Template" in the toolbar → template picker modal opens (same 3 cards).
3. User selects a different template → LaTeX regenerates with same content, preview updates.
4. User downloads the new PDF.

### Flow 3: Explain Mode Discovery
1. User is in the editor, looking at a line like `\resumeSubheading`.
2. User sees the "Explain" toggle in the toolbar and enables it (or the onboarding tooltip prompts them).
3. User clicks the line `\resumeSubheading{Google}{Mountain View, CA}{Software Engineer}{Jun 2022 – Present}`.
4. A sidebar panel slides in: *"This creates a formatted job entry with your company name, location, title, and dates — arranged in a two-line block with bold company name and right-aligned dates."*
5. User clicks a different line and the panel updates instantly.

---

## 7.1 Error States (Friendly Fixes)

| Trigger | User-facing message | Recovery action |
|---|---|---|
| Network failure on convert | "Couldn't reach the server — check your connection and try again." | Retry button |
| File upload — unsupported type | "We only accept PDF or DOCX files. Try uploading one of those." | Re-open file picker |
| File upload — too large (> 5MB) | "That file is a bit big (max 5 MB). Try a smaller version or paste the text directly." | Switch to paste tab |
| AI parse returns empty / low confidence | "We couldn't read enough from that input. Try pasting your resume as plain text instead." | Switch to paste tab |
| LaTeX compile error | "There's a syntax issue in your LaTeX — check the highlighted line. [Line N: {error summary}]" | Highlight offending line in editor; link to Explain Mode |
| Free tier limit hit | "You've used all 3 free exports this month. Upgrade to Pro for unlimited downloads." | Upgrade modal with monthly/annual CTA |
| Session expired / not found | "We couldn't find that session — it may have expired. Start a new resume." | Button back to `/build` |
| Auth expired | "Your session timed out. Sign in to continue." | Redirect to login |
| 500 / unexpected | "Something went wrong on our end. We've been notified." | Retry button + link to `/build` |
| Empty input on convert | "Paste your resume text or upload a file to get started." | Inline hint under the input |

---

## 8. Accessibility

- **Target standard:** WCAG 2.1 AA
- **Keyboard navigation:** All interactive elements (template cards, toolbar buttons, editor panes) reachable and operable via keyboard. Tab order follows visual reading order.
- **Screen reader support:** Semantic HTML throughout. ARIA labels on icon-only buttons (e.g. download, switch template). The PDF preview iframe has `title="Resume PDF preview"`. Explain Mode panel is announced via `aria-live="polite"`.
- **Colour contrast:** Minimum 4.5:1 for all body text. Template card previews include text labels (not colour alone) to identify templates.
- **Focus indicators:** Visible custom focus ring on all focusable elements (do not suppress `outline`).
- **Motion:** The panel slide-in for Explain Mode respects `prefers-reduced-motion` (instant show/hide instead of animation).
- **Forms:** All inputs have associated `<label>` elements. Errors are announced to screen readers via `role="alert"`.
- **Editor accessibility:** CodeMirror is used with its built-in ARIA support enabled. Provide a plain-text fallback textarea for screen-reader-only users who cannot use the rich editor.
- **Testing tools:** axe DevTools + Lighthouse on every new screen. Manual VoiceOver (macOS) pass before v1.0 release.

---

## 9. Security & Privacy

- **Auth strategy:** Magic link email (Resend) + optional Google OAuth via NextAuth.js. JWTs stored as httpOnly cookies. No passwords stored.
- **Sensitive data:** Resume content (PII — name, email, phone, work history) is stored transiently in the session and, for Pro users, encrypted at rest in the DB (AES-256). Resume data is **never logged** in plaintext. AI parse calls to the LLM API are made server-side; no resume content is sent client-to-third-party directly.
- **Rate limiting:** `/api/convert` — 5 requests/minute per IP (Upstash Redis). `/api/compile` — 10 requests/minute per session. Auth endpoints — 10 attempts/hour per IP.
- **Data retention:** Anonymous session data (resume JSON, generated LaTeX) is deleted after 24 hours. Pro cloud saves are retained while the account is active. Account deletion purges all data within 30 days (GDPR Article 17 compliant).
- **Third-party data sharing:** Stripe (payment metadata only — no resume content). Posthog (anonymised product analytics — no PII). Resend (email address for magic links only).
- **Compliance:** GDPR (EU users) — cookie consent banner, privacy policy, data deletion flow. No CCPA obligations anticipated at launch scale but policy is written to be compliant.

---

## 10. Test Plan

| Layer | Framework | Coverage target | Notes |
|---|---|---|---|
| Unit | Vitest | 80% | Pure functions: resume parser, LaTeX generator, template mapper |
| Integration | Vitest + MSW | Key API flows | `/api/convert`, `/api/compile`, `/api/export` with mocked LLM and LaTeX service |
| E2E | Playwright | Happy paths + critical error states | Flow 1 (paste → export), Flow 3 (Explain Mode), limit-hit modal |

**TDD requirement:** Yes — write failing test first for all API routes and business logic.
**Test file location:** Co-located `*.test.ts` alongside source; E2E tests in `e2e/`.
**CI gate:** Tests must pass before merge: Yes (GitHub Actions).
**Accessibility test:** Run axe-playwright on every new screen before shipping: Yes.

---

## 11. Core Data Model

### User
| Property | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `email` | `string` | Unique, indexed |
| `plan` | `enum` | `free` \| `pro` |
| `stripe_customer_id` | `string` | Nullable; set on first Pro subscription |
| `created_at` | `timestamp` | |
| `deleted_at` | `timestamp` | Nullable; soft delete for GDPR |

### Session
| Property | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key; used as URL slug `/editor/[id]` |
| `user_id` | `uuid` | Nullable (anonymous sessions have no user) |
| `raw_input` | `text` | Original pasted text or extracted text from upload; encrypted at rest |
| `parsed_resume` | `jsonb` | Structured resume data (name, contact, sections[]); encrypted at rest |
| `selected_template` | `enum` | `classic` \| `modern` \| `minimal` |
| `latex_source` | `text` | Current state of the LaTeX source (may be user-edited); encrypted at rest |
| `expires_at` | `timestamp` | 24h for anonymous; null for Pro saved resumes |
| `created_at` | `timestamp` | |

### UsageLedger
| Property | Type | Notes |
|---|---|---|
| `id` | `uuid` | |
| `user_id` | `uuid` | FK → User; nullable for anonymous (keyed by session instead) |
| `session_id` | `uuid` | FK → Session; used for anonymous tracking |
| `action` | `enum` | `generate` \| `export_pdf` \| `export_zip` |
| `created_at` | `timestamp` | Used for rolling 30-day window calculation |

### Template (static seed data, not user-editable)
| Property | Type | Notes |
|---|---|---|
| `slug` | `enum` | `classic` \| `modern` \| `minimal` |
| `display_name` | `string` | e.g. "Classic Academic" |
| `preview_image_url` | `string` | Used in template picker cards |
| `description` | `string` | One-line description shown in picker |

---

## 12. Technical Specification

### Tech Stack
| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Frontend | Next.js (App Router) + TypeScript | 15.x | SSR for landing page SEO, RSC for fast initial load, file-based routing |
| Editor | CodeMirror 6 | 6.x | Best-in-class web code editor; LaTeX language extension available |
| Styling | Tailwind CSS | 4.x | Utility-first; fast to build; consistent design tokens |
| Backend | Next.js API routes (Edge Runtime where possible) | 15.x | Minimal surface; avoids separate server |
| LaTeX Compilation | Tectonic (Rust-based TeX engine) via Docker sidecar | latest | Self-contained; no TeXLive install required; fast |
| AI / Parse | Google Gemini API via `@google/generative-ai` SDK | latest | `gemini-2.0-flash` for low-latency tasks (resume parsing, Explain Mode); `gemini-1.5-pro` for quality-sensitive tasks (LaTeX generation). API key stored in `GEMINI_API_KEY` env var — never exposed client-side. |
| Database | Postgres (Neon serverless) | 16.x | Serverless-friendly; good Next.js integration |
| ORM | Drizzle ORM | latest | Type-safe; works well with Neon |
| Auth | NextAuth.js v5 | 5.x | Magic link + Google; httpOnly cookie sessions |
| Payments | Stripe | latest | Subscriptions + Billing Portal |
| File Storage | Cloudflare R2 | — | Compiled PDFs and ZIP exports cached temporarily |
| Email | Resend | — | Magic link delivery |
| Analytics | Posthog | — | Product analytics; self-hostable if needed |
| Hosting | Vercel | — | Zero-config Next.js deployment; Edge Functions |
| CI/CD | GitHub Actions | — | Lint → Test → Build → Deploy on merge to `main` |

### API / Integration Surface
| Endpoint | Method | Purpose | Auth |
|---|---|---|---|
| `/api/convert` | POST | Accept raw input (text or file), call Gemini to parse into structured JSON | None (rate-limited by IP) |
| `/api/generate` | POST | Accept parsed JSON + template slug, call Gemini to return generated LaTeX source | None (rate-limited by session) |
| `/api/compile` | POST | Accept LaTeX source, compile via Tectonic sidecar, return PDF blob URL | None (rate-limited by session) |
| `/api/export/pdf` | GET | Stream compiled PDF; decrement usage ledger | Optional Bearer (Pro = no decrement past limit) |
| `/api/export/zip` | GET | Package `.tex` source into ZIP; decrement usage ledger | Optional Bearer |
| `/api/explain` | POST | Accept a LaTeX line/block, return plain-English explanation via Gemini | None |
| `/api/sessions/[id]` | GET/PATCH | Fetch or update session (LaTeX edits, template switch) | Session cookie |
| Stripe Webhook | POST `/api/webhooks/stripe` | Handle subscription events (created, cancelled, payment_failed) | Stripe signature |

### Performance Targets
- Landing page load (p95): `< 1.5s` (static + ISR)
- Resume parse + LaTeX generate (p95): `< 8s` (AI call + generation)
- LaTeX compile to PDF (p95): `< 5s` (Tectonic on warm container)
- Explain Mode tooltip response (p95): `< 1.5s`
- Concurrent users at launch: `~50` (Vercel serverless scales automatically)

---

## 13. Claude Code Configuration

### CLAUDE.md Directives

```markdown
# TeXume — Claude Code Context

## Architecture
Next.js 15 App Router. API routes in `app/api/`. Shared types in `lib/types.ts`.
LaTeX templates as `.tex` partials in `src/templates/[slug]/`. Drizzle schema in `db/schema.ts`.
Tectonic compilation runs in a Docker sidecar on port 9292, called via `lib/compiler.ts`.

## SLC Principle
Every feature shipped must be Simple, Lovable, and Complete. No placeholder UI, no TODO comments
in shipped code, no half-working states. If it's not in §6 Must-Haves, don't build it.

## Coding Conventions
- Use Zod for all API input validation — define schemas in `lib/validators/`
- No `any` types — use `unknown` + narrowing or explicit generics
- All async route handlers must have explicit try/catch; map errors to §7.1 user-facing messages
- Use `lib/logger.ts` for all logging — no `console.log` in shipped code
- Kebab-case for file names; PascalCase for components; camelCase for functions/variables

## LaTeX Templates
- Templates live in `src/templates/[slug]/main.tex` + partials
- Never modify template files directly at runtime — copy to session working directory
- Template slugs: `classic` | `modern` | `minimal`

## Error Handling
Map ALL errors to the user-facing messages in PRD §7.1. Never surface raw LaTeX compile errors or
LLM API errors to the user. Log the raw error server-side via `lib/logger.ts`.

## Testing
- TDD: write failing test before implementing any API route or business logic function
- Vitest for unit + integration; Playwright for E2E
- Test files co-located: `foo.ts` → `foo.test.ts`
- Run `npm run test` before committing

## Git Workflow
- Never push directly to `main`
- Branch naming: `feat/`, `fix/`, `chore/`, `test/`
- PR title format: `[type]: short description`

## Do Not
- Do not log resume content (PII) in plaintext — use `[REDACTED]` in logs
- Do not modify files in `src/templates/` — they are read-only source templates
- Do not ship a feature not in the PRD data model — update `db/schema.ts` first
- Do not add client-side calls to the Gemini API — all LLM calls go through `/api/` routes (API key is server-side only)
```

### Slash Commands (`.claude/commands/`)
| Command | File | Purpose |
|---|---|---|
| `/review` | `review.md` | Code review against SLC standards & TeXume conventions |
| `/test-feature` | `test-feature.md` | Write tests for a named feature |
| `/spec` | `spec.md` | Draft a mini-spec before implementing |
| `/error-states` | `error-states.md` | Audit a screen against §7.1 error state coverage |
| `/pr-summary` | `pr-summary.md` | Generate a PR description from recent changes |
| `/a11y-check` | `a11y-check.md` | Audit a component for WCAG 2.1 AA issues |
| `/latex-check` | `latex-check.md` | Verify a template partial compiles cleanly via Tectonic |

### Subagents (`.claude/agents/`)

> ⚠️ **Note:** Claude Code subagents require a Claude subscription and Claude-family models. Since this project uses Gemini Pro as its AI backend, the subagents below are defined for *future use* if Claude Code access is obtained. In the meantime, the same workflows can be run as manual prompts in any AI chat interface (Gemini, etc.) using the descriptions below as system prompts.

| Agent | Model | Purpose | Tools |
|---|---|---|---|
| `code-reviewer` | claude-sonnet (future) | Reviews PRs for security, style & SLC compliance | Read, Grep, Glob |
| `test-writer` | claude-sonnet (future) | Writes Vitest tests given a feature file | Read, Write, Bash |
| `a11y-auditor` | claude-sonnet (future) | Audits components for WCAG 2.1 AA compliance | Read, Grep |
| `latex-agent` | claude-sonnet (future) | Validates & refines LaTeX template partials | Read, Write, Bash |
| `schema-agent` | claude-sonnet (future) | Data model design & Drizzle migrations | Read, Write, Bash |

### Hooks
| Hook type | Trigger | Action |
|---|---|---|
| `PreToolUse` (Block) | Push to `main` | Block — use a feature branch |
| `PreToolUse` (Block) | Write to `src/templates/` | Block — templates are read-only; create a new template instead |
| `PreToolUse` (Warn) | Shipping a TODO comment | Warn — SLC requires complete code, no TODOs in committed files |
| `PreToolUse` (Warn) | `console.log` in source | Warn — use `lib/logger.ts` instead |
| `PostToolUse` (Notify) | Any change to `db/schema.ts` | Remind to generate and run Drizzle migration |
| `PostToolUse` (Notify) | New API route added | Remind to add rate limiting in `lib/ratelimit.ts` |

---

## 14. Build Plan & Phased Roadmap

### Phase 1 — Foundation
**Goal:** Project scaffolded, CI green, deployable shell, Tectonic sidecar running
| Task | Acceptance Criteria | Est. Sessions |
|---|---|---|
| Repo + CI/CD setup (GitHub Actions → Vercel) | Green build on push to `main` | 1 |
| DB schema + Drizzle migrations (User, Session, UsageLedger) | Migrations run cleanly on Neon; `npm run db:migrate` works | 1 |
| Auth flow (magic link + Google OAuth via NextAuth v5) | Sign up / sign in / sign out end-to-end; httpOnly cookie set | 1–2 |
| Tectonic Docker sidecar + `lib/compiler.ts` | Given a valid `.tex` file, `compile()` returns a PDF buffer | 1 |
| Usage ledger service | `recordAction()` writes a row; `getRemainingQuota()` returns correct count | 1 |

### Phase 2 — Core Features
**Goal:** Full end-to-end flow from paste → editor → download working
| Task | Acceptance Criteria | Est. Sessions |
|---|---|---|
| `/build` page — text paste + file upload (PDF/DOCX) | User can paste text or upload file; input is validated and sent to `/api/convert` | 1 |
| `/api/convert` — AI resume parser | Given resume text, returns structured JSON conforming to `ParsedResume` type; Zod-validated | 1–2 |
| `/api/generate` — LaTeX generator (all 3 templates) | Given ParsedResume + template slug, returns compilable `.tex` source for each template | 2 |
| Template picker UI | 3 cards with preview thumbnails render correctly; selection triggers generation | 1 |
| Split-pane editor (`/editor/[id]`) — CodeMirror + PDF preview | Editor loads; user can type; 500ms debounce triggers `/api/compile`; preview updates | 2 |
| File tree panel | Shows `main.tex` + partials; clicking a file loads it in the editor | 1 |
| PDF + ZIP export | Download buttons work; usage ledger decrements; free limit modal fires at correct threshold | 1 |
| Explain Mode (`/api/explain` + sidebar) | Click a line → sidebar shows plain-English explanation within 1.5s | 1–2 |

### Phase 3 — Polish & SLC Gate
**Goal:** Production-ready; passes SLC checklist before v1.0.0 tag
| Task | Acceptance Criteria | Est. Sessions |
|---|---|---|
| All §7.1 error states wired up | Every row in the error state table has a live, tested implementation | 1 |
| Accessibility audit | WCAG 2.1 AA pass via axe-playwright + manual VoiceOver | 1 |
| Performance tuning | All §12 perf targets met under simulated load | 1 |
| Pro upgrade flow (Stripe) | Payment → `plan` set to `pro` → limits removed end-to-end | 1 |
| Landing page (`/`) | Polished, no placeholder copy, includes template previews and social proof section | 1 |
| Deployment + smoke test | Live on Vercel; all 3 flows in §7 work in production | 1 |

**SLC Gate Checklist (must pass before tagging v1.0.0):**
- [ ] Every Must-Have feature is shipped and complete
- [ ] No placeholder UI or copy anywhere in the app
- [ ] All §7.1 error states implemented and covered by Playwright tests
- [ ] WCAG 2.1 AA passes axe-playwright + manual VoiceOver
- [ ] Full Vitest suite green in CI
- [ ] Free / Pro limits enforced and surfaced with friendly UI (not raw errors)
- [ ] Resume PII not logged in plaintext anywhere
- [ ] Stripe webhook handles subscription created, cancelled, and payment_failed
- [ ] Rate limiting active on all `/api/` routes
- [ ] Tectonic sidecar stable under 10 concurrent compile requests

---

## 15. Risks & Open Questions

| Risk / Question | Likelihood | Impact | Mitigation / Owner |
|---|---|---|---|
| Tectonic compilation latency spikes | Med | High | Cache compiled PDFs in R2 by content hash; warm container pool |
| LLM parse quality on unusual resume formats | High | Med | Fallback to a structured form input if parse confidence < 0.7; always show parsed data for user review before generating |
| Scope creep (job tailoring, LinkedIn import) | High | High | Hard lock §6 Must-Haves; Should-Haves don't start until v1.0.0 ships |
| Tectonic Docker cold start on Vercel | Med | Med | Run Tectonic as a long-lived Railway/Fly.io service instead of a Vercel function |
| Open question: should Explain Mode use a pre-built dictionary or live Gemini API calls? | — | Med | Start with Gemini API calls; cache responses by LaTeX command signature; build dictionary from cache over time. Owner: TBD, decide by Phase 2 start. |
| Copyright / ToS on uploaded resumes | Low | High | Privacy policy clearly states resumes are processed transiently and not used for training |

---

## 16. Appendix

### Glossary
| Term | Definition |
|---|---|
| SLC | Simple, Lovable, Complete — the quality bar for every release |
| Tectonic | A modern, self-contained LaTeX/XeTeX engine written in Rust; used instead of full TeXLive |
| ParsedResume | The TypeScript type representing structured resume data extracted from raw input |
| Explain Mode | TeXume's signature feature: click any LaTeX line to get a plain-English explanation |
| Session | A single resume-editing workspace, identified by UUID, stored in the DB |

### Reference Links
- Competitor 1: https://lampzi.com
- Competitor 2: https://wegetemployed.com
- Competitor 3: https://www.wresume.ai/
- Tectonic docs: https://tectonic-typesetting.github.io/
- CodeMirror 6: https://codemirror.net/
- NextAuth v5: https://authjs.dev/
- Google Gemini API docs: https://ai.google.dev/gemini-api/docs
- `@google/generative-ai` SDK: https://www.npmjs.com/package/@google/generative-ai

### Changelog
| Date | Author | Change |
|---|---|---|
| 2026-03-17 | Claude | Initial draft — v1.0.0 scope defined |
| 2026-03-17 | Claude | Swapped Anthropic Claude API → Google Gemini API (`gemini-2.0-flash` / `gemini-1.5-pro`); updated subagents note; added Gemini SDK reference links |
