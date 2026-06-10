# BookKit — Project Specification

> A bookish social reading platform combining a personal bookshelf, in-browser reading, recommendations, and community features — inspired by Fable, Goodreads, and Kindle.

**Status:** Planning  
**Initial platform:** Web (responsive)  
**Future platform:** Native mobile app (iOS / Android)

---

## Table of Contents

1. [Vision](#vision)
2. [User Roles](#user-roles)
3. [Feature Overview](#feature-overview)
4. [User Flows](#user-flows)
5. [Data Model (High Level)](#data-model-high-level)
6. [Recommended Tech Stack](#recommended-tech-stack)
7. [Architecture Overview](#architecture-overview)
8. [Roadmap](#roadmap)
9. [Security](#security)
10. [Hosting & Infrastructure](#hosting--infrastructure)
11. [Storage](#storage)
12. [Legal & Content Considerations](#legal--content-considerations)
13. [Mobile App Strategy](#mobile-app-strategy)
14. [Open Questions & Decisions](#open-questions--decisions)

---

## Vision

BookKit is a reading and social platform where:

- **Admins** upload books (PDFs) you have written or licensed to a central catalog.
- **Readers** build personal bookshelves, track reading progress, discover books by genre, and connect with other readers.
- **The community** shares posts about books, follows each other, and requests titles they want added to the catalog.

The web app ships first. A native app follows once there is traction and a clearer picture of which features matter most on mobile.

---

## User Roles

| Role | Capabilities |
|------|-------------|
| **Guest** | Browse public catalog, view limited profiles, sign up |
| **Reader** | Full bookshelf, reading, social feed, follows, recommendations, book requests |
| **Admin** | Upload/manage books, moderate content, view book requests, manage users |

---

## Feature Overview

### 1. Book Catalog & Admin Upload

- Admins upload PDF books to blob storage.
- Each book has metadata: title, author, description, cover image, genres/tags, publication date, series info (optional).
- Books appear in a browsable **online bookshelf** (grid/list, search, filter by genre).
- Admin dashboard for upload, edit metadata, unpublish/archive.

### 2. Personal Bookshelf

- Users add/remove books from their personal shelf (distinct from the global catalog).
- Reading status per book (Goodreads/Fable-style):
  - **Want to Read**
  - **Currently Reading**
  - **Read**
  - **DNF** (Did Not Finish)
- Optional: star rating, review, date started/finished.
- **Showcase top books** on profile (e.g. top 4–6 favorites, pinned like a social highlight).

### 3. In-Browser Reader

- Open a book from the shelf and read inside the app (PDF viewer).
- **Save reading progress** automatically (page number, scroll position, or percentage).
- Resume exactly where the user left off on return.
- Basic reader controls: zoom, fullscreen, dark/light mode, bookmarks (stretch goal).

### 4. Recommendations

- Users select **genre preferences** in settings or onboarding.
- Recommendations based on:
  - Selected genres
  - Books marked Read / Currently Reading
  - Similar users (collaborative filtering — later phase)
- Surfaces on a dedicated page and optionally on the home/dashboard.

### 5. Social Feed

- Users post text (and optionally images) about books — reviews, thoughts, quotes, reading updates.
- Posts can **tag/link a book** from the catalog.
- Feed shows posts from **people you follow** + optionally trending/popular posts.
- Like, comment, share (stretch).

### 6. User Profiles & Social Graph

- Account with username, email, password, profile picture.
- Edit profile: bio, display name, genre preferences, showcase books.
- **Follow / unfollow** other users.
- View another user's shelf, showcase, and public activity.

### 7. Book Requests

- **"Request a Book"** page: title, author, optional notes, optional ISBN/link.
- Submissions go to an **admin queue** (in-app notification + email optional).
- Admins can mark requests as: pending, sourced, added, declined.
- Optional: upvote popular requests (community signal for sourcing priority).

### 8. Updates & Notifications

- Notify users when **new books** are added (especially in their preferred genres).
- Notify on follows, comments, likes (as social features grow).
- In-app notification center; email digests optional.

---

## User Flows

### Onboarding

```
Sign up → Set username & avatar → Pick genres → Browse catalog → Add first book to shelf
```

### Reading

```
Open shelf → Select book → Reader opens at saved progress → Progress auto-saves → Mark status when done
```

### Social

```
Follow users → See feed → Post about a book → Others engage → Discover books via feed
```

### Request a Book

```
Request form → Admin notified → Admin sources book → Book added to catalog → Requester notified
```

---

## Data Model (High Level)

Use this as a starting schema — refine during implementation.

```
User
  id, email, username, password_hash, avatar_url, bio, created_at
  genre_preferences[] (relation or JSON)

Book
  id, title, author, description, cover_url, pdf_blob_key, genres[], published_at, uploaded_by, status

UserBook (shelf entry)
  user_id, book_id, status (want_to_read | reading | read | dnf)
  rating, review, started_at, finished_at, showcase_order (nullable)

ReadingProgress
  user_id, book_id, page_or_position, percentage, last_read_at, device_hint (optional)

Post
  id, user_id, body, book_id (optional), created_at

Follow
  follower_id, following_id

BookRequest
  id, user_id, title, author, notes, status, created_at

Notification
  id, user_id, type, payload, read_at, created_at
```

**Indexes to plan early:** `user_id` on shelf/progress, `book_id` on progress, `follower_id` / `following_id`, genre tags on books.

---

## Recommended Tech Stack

These are suggestions — pick one cohesive stack and stay consistent.

| Layer | Recommendation | Why |
|-------|----------------|-----|
| **Frontend** | Next.js (React) + TypeScript | SSR, routing, API routes, strong ecosystem |
| **Styling** | Tailwind CSS + shadcn/ui | Fast, consistent UI for bookshelf/social layouts |
| **Backend API** | Next.js API routes or separate NestJS/FastAPI | Start monolith; split later if needed |
| **Database** | PostgreSQL (Supabase or Neon) | Relational data, good for social graph & shelf |
| **Auth** | Clerk, Auth.js, or Supabase Auth | Email/password, sessions, OAuth later |
| **File storage** | Azure Blob Storage, AWS S3, or Cloudflare R2 | PDFs and cover images |
| **PDF rendering** | PDF.js (Mozilla) | Client-side, no extra server cost for viewing |
| **Search** | Postgres full-text or Algolia/Typesense (later) | Catalog search at scale |
| **Email** | Resend or SendGrid | Password reset, admin alerts, digests |
| **Analytics** | Plausible or PostHog | Privacy-friendly usage tracking |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Web Client (Next.js)                     │
│  Bookshelf │ Reader (PDF.js) │ Feed │ Profile │ Requests    │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / API
┌──────────────────────────▼──────────────────────────────────┐
│                    API Layer (REST or tRPC)                    │
│  Auth │ Books │ Shelf │ Progress │ Social │ Admin │ Notify   │
└──────┬──────────────┬──────────────────────┬────────────────┘
       │              │                      │
       ▼              ▼                      ▼
  PostgreSQL    Blob Storage            Email / Queue
  (users,       (PDFs, avatars,         (notifications,
   shelves,      covers)                book requests)
   posts)
```

**Principles:**

- **Monolith first** — one repo, one deployable app until traffic demands splitting.
- **Signed URLs for PDFs** — never expose raw blob URLs; generate short-lived access tokens per user/session.
- **Progress writes debounced** — save reading position every few seconds, not every scroll event.
- **Admin actions audited** — log who uploaded/changed/removed books.

---

## Roadmap

### Phase 0 — Foundation (Weeks 1–2)

**Goal:** Repo, auth, deploy pipeline, empty shell.

- [ ] Initialize monorepo or single Next.js app with TypeScript
- [ ] Set up PostgreSQL + migrations (Prisma or Drizzle)
- [ ] Implement auth: sign up, login, logout, password resets
- [ ] Basic layout: nav, responsive shell, placeholder pages
- [ ] CI/CD: lint, test, deploy to staging (Vercel + managed DB)
- [ ] Environment variables documented (`.env.example`)

**Exit criteria:** A user can register, log in, and see a protected dashboard.

---

### Phase 1 — Catalog & Admin Upload (Weeks 3–4)

**Goal:** Books exist in the system and admins can manage them.

- [ ] Blob storage bucket + IAM (private PDFs, public covers)
- [ ] Admin role + admin-only upload UI
- [ ] Book CRUD: title, author, description, genres, cover, PDF
- [ ] Public catalog page: grid, search, genre filter
- [ ] Book detail page (metadata only — no reader yet)

**Exit criteria:** Admin uploads a PDF; any logged-in user can browse and view book details.

---

### Phase 2 — Personal Bookshelf & Reading Status (Weeks 5–6)

**Goal:** Users curate their shelf and track status.

- [ ] Add/remove book from personal shelf
- [ ] Status: Want to Read, Currently Reading, Read, DNF
- [ ] Optional rating and dates
- [ ] "My Bookshelf" page with filters by status
- [ ] Showcase books on profile (select & order)

**Exit criteria:** User shelf reflects status changes; profile shows showcase.

---

### Phase 3 — Reader & Progress (Weeks 7–9)

**Goal:** Read in-browser and resume where you left off.

- [ ] Integrate PDF.js reader component
- [ ] Secure PDF delivery (signed URLs, auth check)
- [ ] Auto-save reading progress (page/percentage)
- [ ] "Continue reading" on dashboard and book cards
- [ ] Reader UX: zoom, page nav, mobile-friendly controls
- [ ] Dark mode for reader (stretch)

**Exit criteria:** Close tab mid-book, return later, land on same page.

---

### Phase 4 — Genres & Recommendations (Weeks 10–11)

**Goal:** Discovery beyond browsing.

- [ ] Genre preference picker (onboarding + settings)
- [ ] Rule-based recommendations: same genres, exclude already-read
- [ ] Recommendations page + widgets on home
- [ ] "New in your genres" when admins add books

**Exit criteria:** User with genre prefs sees relevant unread books.

---

### Phase 5 — Social Core (Weeks 12–15)

**Goal:** Profiles, follows, and feed.

- [ ] Public profile pages (shelf, showcase, bio)
- [ ] Follow / unfollow
- [ ] Create posts (text + optional book tag)
- [ ] Home feed from followed users
- [ ] Likes and comments (MVP)
- [ ] Basic moderation: report post

**Exit criteria:** Two users can follow each other and see posts in feed.

---

### Phase 6 — Book Requests & Admin Queue (Weeks 16–17)

**Goal:** Close the loop between readers and catalog growth.

- [ ] Request a Book form
- [ ] Admin queue: list, filter, update status
- [ ] Notify requester when book is added (in-app)
- [ ] Optional: upvotes on requests

**Exit criteria:** Request submitted → admin sees it → status updated → user notified.

---

### Phase 7 — Notifications & Polish (Weeks 18–20)

**Goal:** Retention and production readiness.

- [ ] In-app notification center
- [ ] Email: password reset, optional new-book digests
- [ ] Performance: image optimization, lazy load catalog
- [ ] Accessibility pass (keyboard, screen reader basics)
- [ ] Error boundaries, loading states, empty states
- [ ] Terms of Service, Privacy Policy pages

**Exit criteria:** Beta-ready web app with core loop complete.

---

### Phase 8 — Beta & Iterate (Ongoing)

- [ ] Invite-only or open beta
- [ ] Analytics on funnel: sign-up → first book → first read → return visit
- [ ] Fix top friction from user feedback
- [ ] Admin moderation tools if needed

---

### Phase 9 — Mobile App (Post-Traction)

**Goal:** Native experience when web validates product-market fit.

- [ ] **React Native (Expo)** recommended — share types/API with web
- [ ] Auth parity, shelf, reader (native PDF or WebView), feed, profile
- [ ] Push notifications (new books, social)
- [ ] App Store / Play Store submission

**Do not start mobile until:** reading progress sync works reliably on web, and you have evidence users return to read.

---

## Security

### Authentication & Accounts

| Concern | Approach |
|---------|----------|
| Password storage | bcrypt or Argon2; never store plaintext |
| Sessions | HTTP-only secure cookies or short-lived JWT + refresh rotation |
| Password reset | Time-limited single-use tokens; rate limit requests |
| Username/email change | Re-verify email; prevent impersonation |
| Brute force | Rate limit login and signup per IP/email |

### Authorization

- Every API route checks: **Is user authenticated?** **Do they own this resource?** **Is admin required?**
- Users can only read PDFs for books on their shelf or in catalog policy you define (e.g. all logged-in users).
- Admin routes behind role check + optional IP allowlist for upload in early beta.

### File & Content Security

| Concern | Approach |
|---------|----------|
| PDF access | Private blob; signed URLs expiring in 15–60 minutes |
| Upload validation | Admin-only; verify MIME type, file size cap, scan for malware (ClamAV or cloud scanner) |
| XSS in posts | Sanitize HTML; use markdown with allowlist if rich text |
| CSRF | SameSite cookies + CSRF tokens on mutating requests |
| Profile images | Resize server-side; strip EXIF; validate image types |

### API & Infrastructure

- HTTPS everywhere; HSTS in production
- Rate limiting on auth, upload, and post endpoints
- Input validation on all endpoints (Zod or similar)
- Secrets in environment variables / secret manager — never in git
- Dependency updates and `npm audit` in CI
- Structured logging without PII in logs

### Privacy (GDPR-minded)

- Privacy policy explaining what you store (reading progress, posts, follows)
- Export/delete account flow (eventually required in EU)
- Minimal data collection; clear consent for marketing emails

### Social & Abuse

- Report user/post flow
- Block user (hide from feed)
- Admin ban/suspend
- Rate limit posts and follows to reduce spam bots

---

## Hosting & Infrastructure

### Suggested Setup (Cost-Conscious Start)

| Component | Service | Notes |
|-----------|---------|-------|
| **Web app** | Vercel or Netlify | Zero-config Next.js deploys |
| **Database** | Neon, Supabase, or Railway Postgres | Free tier for dev; scale plan for prod |
| **Blob storage** | Azure Blob, AWS S3, or Cloudflare R2 | R2 has no egress fees — good for PDFs |
| **CDN** | Cloudflare (optional) | Cache covers; DDoS protection |
| **Email** | Resend | Simple API, good deliverability |
| **Domain** | Cloudflare Registrar or Namecheap | `bookkit.com` or your chosen name |

### Environments

- **Local** — Docker Compose for Postgres optional; `.env.local`
- **Staging** — mirror prod config; test uploads and auth
- **Production** — separate DB and storage bucket; backups enabled

### Backups & Reliability

- **Database:** daily automated backups; test restore quarterly
- **Blob storage:** versioning on bucket; lifecycle rules for old drafts
- **Uptime:** health check endpoint; status page if you go public

### Cost Drivers to Watch

- PDF storage size (many large files add up)
- Blob egress (mitigate with CDN + signed URLs + R2)
- Database size as social data grows
- Email volume for notifications

### CI/CD Checklist

- Push to `main` → deploy staging
- Tag release → deploy production
- Run: lint, typecheck, unit tests on PR
- Preview deployments per PR (Vercel)

---

## Storage

### What Goes Where

| Asset | Storage | Access |
|-------|---------|--------|
| **Book PDFs** | Private blob bucket | Signed URL after auth |
| **Cover images** | Public blob or CDN | Direct URL |
| **Avatars** | Public blob (or private + signed) | Cached URLs |
| **Metadata** | PostgreSQL | API only |

### Blob Structure (Example)

```
books/
  {book_id}/
    original.pdf
    cover.jpg
users/
  {user_id}/
    avatar.jpg
```

### Upload Flow (Admin)

1. Admin selects PDF + metadata in UI
2. API validates file → uploads to blob → stores `pdf_blob_key` in DB
3. Generate thumbnail/cover from first page (optional, Phase 1+)
4. Book appears in catalog

### PDF Delivery Flow (Reader)

1. User opens book → API verifies shelf/access
2. API generates signed URL for `books/{id}/original.pdf`
3. PDF.js loads from signed URL in browser
4. Progress saved to `ReadingProgress` table

### Limits to Define Early

- Max PDF size (e.g. 50–100 MB per book)
- Max avatar size (e.g. 2 MB)
- Total storage budget alert (e.g. email at 80% capacity)

---

## Legal & Content Considerations

> **Important:** You are uploading books you have written. Still plan for rights and user-generated content.

- **Copyright:** Only upload works you own or have licensed. Metadata should credit authors correctly.
- **Terms of Service:** Users agree not to redistribute PDFs; reading is in-app only.
- **DMCA / takedown:** Process if third-party content is ever added.
- **User posts:** You are publisher of UGC — moderation and ToS matter.
- **Children:** If open to under-13, COPPA applies — consider 13+ only at launch.
- **Regional:** GDPR (EU), UK GDPR if you have UK users — privacy policy and data rights.

Consult a lawyer before public launch if you scale beyond a small private beta.

---

## Mobile App Strategy

### Why Web First

- Faster iteration on bookshelf, reader, and social features
- One codebase for desktop and mobile browsers
- Validates retention before App Store investment

### When to Build Native

- Weekly active readers returning to finish books
- Clear demand for push notifications and offline reading
- Budget for two store listings and maintenance

### Technical Path

1. **API-first web** — all features through REST/tRPC so mobile reuses the same backend
2. **Expo (React Native)** — share TypeScript types and API client with Next.js
3. **Reader on mobile** — PDF.js in WebView initially; native reader later if needed
4. **Progress sync** — same `ReadingProgress` API; last-write-wins or timestamp merge

---

## Open Questions & Decisions

Track these as you build — resolve before or during the relevant phase.

| Question | Options | Decide by |
|----------|---------|-----------|
| Public vs invite-only beta? | Open signup vs invite codes | Phase 7 |
| Who can read any book? | All logged-in users vs must add to shelf first | Phase 3 |
| Reviews public or friends-only? | Public default like Goodreads | Phase 5 |
| Rich text in posts? | Plain text vs markdown | Phase 5 |
| ISBN / external book metadata? | Manual only vs Open Library API | Phase 1 |
| Monetization? | Free, ads, subscription, tips | Post-beta |
| Offline reading? | Web: unlikely; Mobile: later | Phase 9 |
| Multi-format? | PDF only at launch vs EPUB later | Phase 1 |

---

## Success Metrics (Beta)

| Metric | Target (example) |
|--------|------------------|
| Sign-up → add first book | > 40% |
| Add book → open reader | > 60% |
| Return within 7 days after first read | > 25% |
| Avg. session length in reader | > 10 min |
| Book requests submitted / month | Track growth |

---

## Next Steps (Immediate)

1. **Choose stack** — e.g. Next.js + Prisma + Neon + Cloudflare R2 + Clerk
2. **Create repo structure** — `apps/web`, `packages/db`, or flat Next.js app
3. **Phase 0** — auth + deploy + empty pages from roadmap
4. **Design pass** — wireframe: catalog, shelf, reader, profile (Figma or paper)
5. **Register domain** and set up staging environment

---

## Document History

| Date | Change |
|------|--------|
| 2026-06-10 | Initial specification and roadmap |

---

*This document is the single source of truth for BookKit scope until implementation begins. Update it as decisions are made and phases complete.*
