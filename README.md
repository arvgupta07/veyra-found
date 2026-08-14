# Veyra Found

**India's co-founder matching platform** — Hinge-style, not Tinder. Founders browse rich profiles, reply to prompts that resonate, and move through structured stages from first message to confirmed co-founder. Built for the Indian startup ecosystem.

**Live:** [veyrafound.in](https://veyrafound.in) · [veyra-found.lovable.app](https://veyra-found.lovable.app)

---

## What it is

Veyra Found connects Indian founders, investors, and early-stage talent in one place:

| Space | What it does |
| --- | --- |
| **Co-founder matching** | Scroll through full founder profiles (no swiping). Tap "Text them about this" on a prompt, send a connection request, and chat once accepted. |
| **Compatibility science** | 20-question assessment + AI-generated compatibility reports when a match is accepted. |
| **Community forum** | Idea validation, co-founder calls, industry talk, resources, and success stories — with polls, media, and upvote/downvote. |
| **Investor directory** | Founders browse angels and funds, filter by thesis/stage/cheque size, and pitch directly. |
| **Opportunities** | Founders post internships and startup roles; talent browses and applies. |
| **Talent pool** | Founders discover engineers, designers, and interns looking to join early startups. |

---

## Account types

Everyone picks a role **before sign-up** (`/auth/role`). The choice is locked after onboarding.

| Type | Onboarding | Main experience |
| --- | --- | --- |
| **Founder** | 4-step profile + prompts + compatibility quiz | Discover, Inbox, Forum, Investors, Opportunities, Talent |
| **Investor** | 3-step firm profile (thesis, cheque size, portfolio) | Investor directory, pitch inbox |
| **Talent / Intern** | 3-step profile with mandatory CV | Browse roles and founders, apply with a note |

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | [TanStack Start](https://tanstack.com/start) (SSR) + [TanStack Router](https://tanstack.com/router) (file-based routes) |
| UI | React 19, TypeScript, Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com) |
| Data | Supabase (Auth, Postgres, Realtime, Storage) |
| State | TanStack Query (server state), React hooks (local state) |
| AI | Lovable AI Gateway → Gemini (server-side compatibility reports) |
| Charts | Recharts |
| Icons | Lucide React |
| Toasts | Sonner |
| Deploy | Lovable / Vercel-compatible Nitro build |

---

## Routes

| Path | Description |
| --- | --- |
| `/` | Landing page |
| `/auth/role` | Pre-sign-up account type picker |
| `/auth/signup` | Sign up (Google or email) |
| `/auth/login` | Log in |
| `/auth/callback` | OAuth callback |
| `/auth/reset-password` | Password reset |
| `/onboarding` | Role-specific onboarding flow |
| `/discover` | Browse founder profiles (Hinge-style) |
| `/profile/:founderId` | View a founder's public profile |
| `/profile/me` | Edit your own profile |
| `/inbox` | Connection requests, sent requests, and active conversations |
| `/inbox/:conversationId` | Full conversation view with chat, stages, labels, and compatibility report |
| `/forum` | Community forum feed |
| `/forum/:postId` | Single post with threaded comments |
| `/investors` | Investor directory and pitching |
| `/roles` | Job/internship board (post and apply) |
| `/talent` | Browse talent and intern profiles |
| `/dashboard` | Investor welcome (minimal) |
| `/admin` | Admin moderation panel (admin role only) |

Protected routes redirect unauthenticated users to `/auth/login`. Incomplete onboarding redirects to `/onboarding`.

---

## Key features

### Co-founder discovery
- One full profile at a time — scroll, don't swipe
- Filter by background, stage, commitment, remote preference, and search
- Prompt-specific connection requests with optional message
- Verification gate: verified founders can send requests and messages; everyone can browse

### Inbox & chat
- Tabs: **Requests** (incoming), **Sent**, **Talking** (active conversations)
- Conversation stages: Talking → Intro Call → Trial Project → Confirmed
- Custom and built-in labels, pin conversations
- Realtime messages via Supabase
- Resizable **Chat Dock** (desktop) for quick replies without leaving the current page
- AI compatibility report on accept (alignment, divergence, risk flags, conversation starters)

### Forum
- Categories: Idea Validation, Looking for Co-Founder, Industry Talk, Resources, Success Stories
- Upvote / downvote, polls, image and video attachments, cross-posting to multiple categories
- Shadow-ban aware feed

### Marketplace
- **Opportunities** (`/roles`): founders post co-founder, full-time, part-time, and internship roles
- **Talent** (`/talent`): browse job-seekers with skills, availability, and CV links
- **Investors** (`/investors`): public investor profiles with thesis, stages, cheque size; founders send pitches

### Verification & trust
- LinkedIn-based verification requests reviewed in admin
- Trust tiers, profile completeness indicators, verified badges

### Admin (`/admin`)
- User management, shadow bans, verification approval
- Forum posts/comments moderation
- Conversation and message oversight
- Marketplace row management
- Platform stats overview

---

## Project structure

```
src/
  routes/              File-based TanStack Router pages (one file = one route)
  components/
    ui/                shadcn/ui primitives
    onboarding/        Investor and talent onboarding flows
    forum/             Post media, polls
    AppShell.tsx       Sidebar nav, mobile bottom bar, dark mode
    ChatDock.tsx       Docked chat window
    VerifyGate.tsx     Verification banners and gates
  hooks/               useSession, useMyFounder, useLiveInbox, useVerification, …
  lib/                 Business logic, server functions, utilities
  integrations/
    supabase/          Client, server admin, auth middleware, generated types
  styles.css           Tailwind + design tokens (cream/brutalist theme)
supabase/
  migrations/          Postgres schema + RLS policies
public/
  llms.txt             LLM-readable site summary
```

`src/routes/routeTree.gen.ts` is auto-generated — do not edit by hand.

See [`src/routes/README.md`](src/routes/README.md) for TanStack Start routing conventions.

---

## Environment variables

Copy [`.env.example`](.env.example) to `.env` and fill in your values.

```env
# Client (browser + SSR)
VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR-SUPABASE-PUBLISHABLE-KEY

# Server (TanStack Start / Nitro)
SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR-SUPABASE-PUBLISHABLE-KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY
SUPABASE_PROJECT_ID=YOUR-PROJECT-ID

# AI compatibility reports (server-only)
LOVABLE_API_KEY=YOUR-LOVABLE-API-KEY
```

Never commit `.env` or expose the service role key or API key in client code.

---

## Development

**Requirements:** Node.js 18+ (or [Bun](https://bun.sh)), npm or bun.

```sh
git clone <repository-url>
cd veyra-found
npm install   # or: bun install
npm run dev   # or: bun run dev
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Run production server (after build) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

Database schema lives in `supabase/migrations/`. Apply migrations through the Supabase dashboard or CLI against your project.

---

## Database

Core tables (see migrations and `src/integrations/supabase/types.ts` for the full schema):

- **Auth & profiles:** `profiles`, `founders`, `founder_prompts`, `assessments`, `past_ventures`
- **Matching:** `connection_requests`, `conversations`, `messages`, `compatibility_reports`, `conversation_labels`, `conversation_pins`, `blocks`
- **Forum:** `forum_posts`, `forum_comments`, `forum_upvotes`, `forum_saves`, `forum_poll_votes`, `forum_collaborators`
- **Investors:** `investor_profiles`, `investor_pitches`, `investor_feed_listings`, `investor_interests`
- **Marketplace:** `open_roles`, `role_applications`, `talent_profiles`
- **Moderation:** `user_roles`, `verification_requests`, `vouches`

Row Level Security (RLS) is enabled on all tables.

---

## Design

Neo-brutalist cream/ink aesthetic with bold borders and orange accents — distinct from the original navy/Linear spec. Typography: **Inter** (body), **Space Grotesk** (UI), **Archivo Black** (display). Dark mode supported throughout the app shell.

---

## Build with Lovable

This project is connected to [Lovable](https://lovable.dev). Changes pushed to the connected branch sync back to the Lovable editor.

- **Ship faster:** describe features in Lovable and it handles the code.
- **Stay in sync:** Lovable commits directly to this repository.
- **Full ownership:** the code is yours — push to GitHub and continue in Lovable or locally.

Continue in the [Lovable editor](https://lovable.dev/projects/84e55a29-f76e-4519-ae0b-7ac49d2c396e).

> **Note:** Avoid force-pushing or rebasing commits already pushed to the connected branch — that rewrites history on Lovable's side.

---

## License

Private project. All rights reserved unless otherwise specified by the repository owner.
