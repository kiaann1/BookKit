# BookKit Roadmap

Actionable next steps by phase. For vision, data model, and stack rationale see [PROJECT.md](./PROJECT.md).

**Last updated:** 2026-06-10  
**Current position:** Phases 0–5 complete in code. **Next:** Phase 6 (book requests).

---

## Status at a glance

| Phase | Name | Status |
| ----- | ---- | ------ |
| 0 | Foundation | ✅ Complete |
| 1 | Catalog & admin upload | ✅ Complete |
| 2 | Bookshelf & showcase | ✅ Complete |
| 3 | Reader & progress | ✅ Complete |
| 4 | Genres & recommendations | ✅ Complete |
| 5 | Social core | ✅ Complete |
| 6 | Book requests | 🔴 Placeholder page |
| 7 | Notifications & polish | 🔴 Partial |
| 8 | Beta & iterate | 🔴 Not started |
| 9 | Mobile app | ⏸ Post-traction |

---

## Completed work (Phases 0–4)

### Phase 0 — Foundation ✅

- Next.js App Router + TypeScript + Tailwind v4 + shadcn-style UI
- PostgreSQL + Prisma migrations
- Auth.js email/password — sign up, login, logout, password reset (pages + tokens)
- Responsive app shell — nav, dashboard, mobile bottom tabs
- `.env.example` documented; `DISABLE_AUTH` for local dev
- Deployed to Vercel (`book-kit-psi.vercel.app`)

### Phase 1 — Catalog & admin upload ✅

- Vercel Blob / local / S3 storage drivers
- Admin role — `ADMIN_EMAILS`, DB-backed `isAdmin()`, `scripts/promote-admin.sql`
- Admin book CRUD — upload, edit, delete (`/admin/books`, `book-form.tsx`)
- Slug book ids on admin upload (`uniqueDatabaseBookId` in `upload.ts`)
- Post-upload PDF verification (`%PDF-` header check in Blob)
- Public catalog — grid, search, genre filter, book detail pages
- Phase 1 health — `npm run verify:phase1`, `GET /api/health/phase1`, admin readiness panel
- Bulk sync — `npm run db:upload-files`, `scripts/seed-books.sql`, `sync-storage-to-db.ts`
- Open Library metadata lookup (admin form autofill; author-gate for pen names e.g. Ascended)

### Phase 2 — Personal bookshelf & showcase ✅

- Add/remove books from shelf; status: Want to Read, Currently Reading, Read, DNF
- Shelf page with status filters (`/shelf`)
- Rating (1–5 stars), started/finished dates on shelf entries
- `PATCH /api/shelf/[bookId]` for status, rating, dates
- Profile showcase — pick & order up to 6 books (`/profile`, `PUT /api/shelf/showcase`)
- Migration: `20250610160000_add_showcase_order`

### Phase 3 — Reader & progress ✅

- PDF.js reader (`pdf-reader.tsx`) — page nav, zoom, pinch-to-zoom, fullscreen, dark/light, lights-off
- Secure PDF API (`/api/files/books/[bookId]/pdf`) — auth required; S3 redirect; Blob range streaming + full read
- Legacy Ascended PDF path resolution (`src/lib/books/pdf.ts`, `paths.ts`)
- Invalid PDF rejection before serve (`src/lib/files/pdf-validation.ts`)
- Progress API — `GET`/`PUT` `/api/progress/[bookId]`; fields on `UserBook`
- Auto-save progress (debounced); page clamping when total pages change (`normalize.ts`)
- Read route resumes at saved page (`/read/[bookId]`)
- Continue reading — dashboard card, catalog detail, shelf cards, **catalog grid** (`BookCard` + `getProgressForBooks`)
- Reader error UX — clearer messages, **Try again** button
- Phase 3 health — `npm run verify:phase3`, `GET /api/health/phase3`

**Deferred (stretch):** reader bookmarks; Playwright E2E (open → read → reload → same page).

### Phase 4 — Genres & recommendations ✅

- Settings page (`/settings`) — edit name, bio, genre prefs, reading pace
- `GET`/`PATCH` `/api/user/settings`; shared `GenrePicker` component
- Recommendation engine (`src/lib/recommendations/`) — genre scoring, exclude READ/DNF/on-shelf
- `GET /api/recommendations` — full feed or `?section=for-you|new`
- Discover page (`/recommendations`) — “Recommended for you” + “New in your genres”
- Dashboard widgets — `RecommendationWidgets` on home
- Cold start — recently added books when no genre prefs; CTA to settings
- Genre bridge — `Fiction`-only books match fiction subgenre prefs (not cross-subgenre)
- `npm run verify:phase4`, `npm run test:recommendations`, `GET /api/health/phase4`

### Phase 5 — Social core ✅

- Prisma social models — `Follow`, `Post`, `PostLike`, `Comment`, `PostReport`; migration `20250610170000_social_core`
- Social lib (`src/lib/social/`) — follow graph, feed, posts, likes, comments, reports, public profiles
- APIs — follow, posts feed/create, user posts, user search, like, comments, report, book search for tags
- Feed page (`/feed`) — compose post, post cards, user search, load more
- People page (`/people`) — find readers by username or name
- Public profile (`/u/[username]`) — showcase, shelf, follow button, posts
- Settings — username change + avatar upload
- `npm run verify:phase5`, `GET /api/health/phase5`

---

## Ops & hardening (ongoing)

Code shipped; production may still need manual steps.

| Item | Code | Production action |
| ---- | ---- | ----------------- |
| Slug book ids + PDF blob verification | ✅ | Redeploy latest |
| Ascended legacy path + `pdf.ts` fallbacks | ✅ | Redeploy latest |
| `scripts/fix-ascended-admin-upload.sql` | ✅ | Run in Neon if duplicate Ascended rows |
| `scripts/migrate-ascended-book-id.sql` | ✅ | Run if old `&` book id still in DB |
| Large PDF workflow (`db:upload-files`) | ✅ documented in README | Use for files > ~4 MB on Vercel |
| Migrations (progress, showcase, onboarding, social) | ✅ in repo | `prisma migrate deploy` on Neon |
| Vercel env vars | — | Confirm `DATABASE_URL`, `AUTH_SECRET`, `BLOB_*`, `ADMIN_EMAILS` |
| PDF access policy | — | Decide: any logged-in user vs shelf-only (today: any logged-in user) |

---

## Phase 4 — Genres & recommendations ✅

Shipped — see **Completed work** above. Push notifications for new books deferred to Phase 7.

---

## Phase 5 — Social core ✅

**Goal:** Public profiles, follow graph, and a feed of bookish posts.

### Shipped

- **Schema** — `Follow`, `Post`, `PostLike`, `Comment`, `PostReport`; migration `20250610170000_social_core`
- **Lib** — `src/lib/social/` (follow, posts, feed, public profile, map types)
- **Follow API** — `GET`/`POST`/`DELETE` `/api/users/[username]/follow`
- **Posts API** — `GET`/`POST` `/api/posts` (following feed + create); `GET` `/api/users/[username]/posts`
- **Engagement** — `POST` `/api/posts/[id]/like`, `GET`/`POST` `/api/posts/[id]/comments`, `POST` `/api/posts/[id]/report`
- **Book tag search** — `GET /api/books/search` for compose autocomplete
- **User search** — `GET /api/users/search`; search bar on `/feed` + `/people` page (username/name, follow inline, link to profile)
- **Public profile** — `/u/[username]` — showcase, shelf, follower counts, follow button, user posts
- **Feed page** — `/feed` with compose, post cards, load-more pagination
- **Settings** — username change + avatar upload (`AvatarSettings`, `PATCH /api/user/settings`)
- **Profile link** — `/profile` → “Public profile” button to `/u/[username]`
- **Middleware** — `/u` routes protected (login required)
- **Verify** — `npm run verify:phase5`, `GET /api/health/phase5`

### Product decisions (locked for v1)

- Shelf reviews: **private** (not shown on public profile)
- Posts: **plain text** only
- Feed: **following-only** (not your own posts)
- Messaging: **deferred** — direct messages planned for Phase 7+

### Exit criteria

Two users can follow each other, post about a book, and see each other’s posts in the feed. ✅

---

## Phase 6 — Book requests & admin queue

**Goal:** Readers request titles; admins triage and close the loop.

### Done

- `/requests` route (placeholder)

### Next up

- [ ] **Prisma model** — `BookRequest` (`userId`, `title`, `author`, `notes`, `isbn?`, `status`, `adminNote?`, `createdAt`)
- [ ] **Request form** — replace placeholder; Zod validation; success toast
- [ ] **`POST /api/book-requests`** — authenticated; rate limit per user
- [ ] **Admin queue** — `/admin/requests` — filters (pending / sourced / added / declined)
- [ ] **Admin actions** — `PATCH /api/admin/book-requests/[id]` — status, internal note
- [ ] **Link to catalog** — when admin adds book, mark linked request `ADDED`
- [ ] **Requester notification** — in-app (Phase 7); optional email on `ADDED`
- [ ] **Upvotes** (optional) — `BookRequestVote`; sort queue by demand

### Exit criteria

Request submitted → visible in admin queue → status updated → requester sees update in-app.

---

## Phase 7 — Notifications & polish

**Goal:** Retention hooks and production-ready UX.

### Done

- Password reset pages + `PasswordResetToken` model (email send not wired)
- Loading skeletons on key routes
- Mobile-responsive shell and bottom nav
- Reader loading/error states (Phase 3)

### Next up

#### Notifications

- [ ] **Prisma model** — `Notification` (`userId`, `type`, `payload` JSON, `readAt`)
- [ ] **Notification types** — `NEW_BOOK_IN_GENRE`, `FOLLOW`, `POST_LIKE`, `POST_COMMENT`, `BOOK_REQUEST_UPDATED`
- [ ] **`GET /api/notifications`**, `PATCH` mark read / mark all read
- [ ] **Notification bell** — header dropdown + unread badge
- [ ] **Emit on events** — follow, comment, like, book added (genre match), request fulfilled

#### Messaging (post–social core)

- [ ] **Prisma models** — `Conversation`, `Message` (or thread per pair)
- [ ] **Inbox UI** — `/messages` list + thread view
- [ ] **`GET`/`POST` `/api/messages`** — send, list threads, mark read
- [ ] **Start from profile** — “Message” button on `/u/[username]` (mutual follow or open DM policy TBD)

#### Email

- [ ] **Resend integration** — `RESEND_API_KEY`; send password reset (replace dev log)
- [ ] **Transactional templates** — reset password, “book you requested was added”
- [ ] **Digest** (optional) — weekly new books in your genres; opt-in in settings

#### Polish & legal

- [ ] **`error.tsx` boundaries** — root, catalog, reader, feed
- [ ] **Empty states audit** — feed, recommendations, notifications, requests
- [ ] **Accessibility pass** — reader focus, feed keyboard nav, star rating aria
- [ ] **Performance** — `next/image` on all covers; lazy-load catalog; PDF API memory audit
- [ ] **Legal pages** — `/terms`, `/privacy`
- [ ] **Account export/delete** (GDPR-minded)

### Exit criteria

User receives in-app notification when followed or request fulfilled. Password reset email works in production.

---

## Phase 8 — Beta & iterate

**Goal:** Learn from real users and stabilize the core loop.

### Done

- Open signup (register flow)

### Next up

- [ ] **Beta mode flag** — `INVITE_ONLY=true` + invite codes, or open signup (decide in PROJECT.md)
- [ ] **Analytics** — Plausible or PostHog; `signup`, `shelf_add`, `reader_open`, `reader_progress`, `post_create`
- [ ] **Funnel dashboard** — sign-up → first shelf add → first read → 7-day return
- [ ] **Admin moderation** — reported posts queue, user suspend/ban
- [ ] **Feedback channel** — in-app link or form
- [ ] **Load test** — catalog + PDF API under concurrent readers
- [ ] **Runbook** — deploy, migrate, upload books, promote admin

### Exit criteria

10+ beta users complete browse → shelf → read → return without per-session hand-holding.

---

## Phase 9 — Mobile app (post-traction)

**Goal:** Native experience once web retention proves the product.

**Do not start until:** Phase 3 progress sync is reliable and weekly return readers exist on web.

### Next up

- [ ] **API audit** — all features via REST JSON (no mobile-blocking server-only flows)
- [ ] **Expo monorepo** — `apps/mobile` or separate repo sharing types
- [ ] **Auth** — Auth.js session or token-based mobile auth
- [ ] **Screens** — shelf, catalog, reader (WebView + PDF.js), feed, profile
- [ ] **Push notifications** — Expo + server triggers
- [ ] **Offline** (later) — cached progress queue only at launch
- [ ] **Store submission** — icons, screenshots, privacy labels

### Exit criteria

iOS and Android apps log in, read a book, save progress, and view the feed.

---

## Suggested build order

```
Ops hardening (redeploy + Neon SQL as needed)
        │
        ▼
Phase 5 (social)  ← you are here
        │
        ├──► Phase 6 (requests) — parallel after Follow/Post APIs
        │
        ▼
Phase 7 (notifications)
        │
        ▼
Phase 8 (beta)
        │
        ▼
Phase 9 (mobile)
```

---

## Quick reference: placeholder pages to replace

| Route | File | Target phase |
| ----- | ---- | ------------ |
| `/requests` | `src/app/(app)/requests/page.tsx` | 6 |

---

## Verification commands

| Command | Phase |
| ------- | ----- |
| `npm run verify:phase1` | Catalog + storage + admin |
| `npm run verify:phase3` | Reader + progress + PDF delivery |
| `npm run verify:phase4` | Settings + recommendations engine |
| `npm run verify:phase5` | Social graph + feed + profiles |
| `npm run test:recommendations` | Unit tests for genre scoring |
| `GET /api/health/phase1` | Deployed Phase 1 JSON report |
| `GET /api/health/phase3` | Deployed Phase 3 JSON report |
| `GET /api/health/phase4` | Deployed Phase 4 JSON report |
| `GET /api/health/phase5` | Deployed Phase 5 JSON report |

---

## Document history

| Date | Change |
| ---- | ------ |
| 2026-06-10 | Initial roadmap.md — phased next steps from codebase audit |
| 2026-06-10 | Phase 3 marked complete; added Phases 0–3 shipped summary, ops table, verify commands |
| 2026-06-10 | Phase 4 complete — settings, recommendations engine, Discover page, dashboard widgets |
| 2026-06-10 | Phase 4 hardening — genre matching fixes, verify:phase4, test:recommendations |
| 2026-06-10 | Phase 5 complete — social core, settings avatar/username, verify:phase5 |
