# BrandFox — Claude Code Guide

## Project Identity
- **App name**: BrandFox (was "Resume Builder" — never revert)
- **Domain**: https://www.bfox.pro (production) / http://localhost:3000 (dev)
- **Stack**: Next.js 15 · TypeScript · Tailwind CSS 3.4 · NextAuth v4 · Firebase Admin · Firestore · Resend

## Running the App
```bash
npm run dev     # dev server on :3000
npm run build   # production build (runs tsc + next build)
npm run lint    # ESLint check
```

---

## Architecture at a Glance

```
src/
├── app/
│   ├── page.tsx                  # Root — delegates to <HomeShell />
│   ├── layout.tsx                # Root layout + metadata
│   ├── globals.css               # CSS vars, keyframes, utility classes
│   ├── login/page.tsx            # Auth page → <AuthGate />
│   ├── privacy/page.tsx          # Privacy policy (server component)
│   └── api/
│       ├── auth/[...nextauth]/   # NextAuth handler
│       ├── auth/signup/          # Email sign-up endpoint
│       ├── auth/forgot-password/ # Generate + email OTP reset code
│       ├── auth/verify-reset-code/ # Verify OTP (marks verified in Firestore)
│       ├── auth/reset-password/  # Update Firebase password + delete OTP doc
│       ├── contact/              # Contact form → sends email via Resend
│       └── resumes/              # GET/POST list; [id] PUT/PATCH/DELETE
├── components/
│   ├── HomeShell.tsx             # SessionProvider + AuthProvider + Shell gate
│   │                             # Also contains: LandingPage, ContactForm, FaqItem
│   ├── ResumeBuilder.tsx         # Main editor orchestrator (state, save, layout)
│   │                             # Also contains: ResumePicker, WelcomeModal, UserMenu
│   ├── Sidebar.tsx               # All 11 section editors
│   ├── ResumePreview.tsx         # Template renderer + print target
│   ├── DocumentsPanel.tsx        # Resume picker/manager modal
│   ├── AuthGate.tsx              # Auth form — 5 modes (see below)
│   └── templates/                # 8 resume template components + index.ts
├── lib/
│   ├── auth.ts                   # signInEmail, signUpEmail, signInGoogle, signOut
│   ├── auth-options.ts           # NextAuth config (Google + Credentials providers)
│   ├── AuthContext.tsx           # useAuth() hook → { user, loading }
│   ├── firebase-admin.ts         # adminApp(), adminAuth(), adminDb()
│   ├── mailer.ts                 # Resend client — sendPasswordResetCode(), sendContactMessage()
│   └── resumes.ts                # Client-side API helpers (fetch wrappers)
└── types/
    ├── resume.ts                 # All interfaces + constants
    └── next-auth.d.ts            # Augments session with user.id (Firebase uid)
```

---

## Color & Theme System

### CSS Variables (`globals.css` `:root`)
The `:root` variables are defined but the UI primarily uses **hardcoded Tailwind arbitrary values** and the dynamic accent system. The `:root` values may differ from actual UI colors — trust the Tailwind classes in components, not the CSS vars, for visual reference.

The accent color is **dynamic** — users override it via the Appearance panel (stored in `localStorage` as `accentColor` hex and converted to `--accent-rgb` at runtime in `ResumeBuilder.tsx`).

### Tailwind `accent` Token (tailwind.config.ts)
```ts
accent: 'rgb(var(--accent-rgb) / <alpha-value>)'
```
Use `bg-accent`, `text-accent`, `border-accent`, `focus:ring-accent` anywhere.

### App UI Color Map (actual values used in components)
| Element | Class / Value |
|---|---|
| App background | `bg-[#120B07]` |
| Cards, panels | `bg-[#2D1B11]` |
| Input background | `bg-[#120B07]` |
| Borders | `border-white/10` (light) / `border-white/15` (medium) |
| Gold accent | `text-[#C9A84C]` / `bg-accent` |
| Dirty/unsaved dot | `bg-amber-400` |

### Landing Page Colors (`HomeShell.tsx` inline `C` object)
```ts
const C = {
  matteDeep: '#070809',   chocMid: '#3D1A08',   chocDark: '#1C0D03',
  chocBorder: '#5C2D0E',  gold: '#C9A84C',       goldLight: '#E8C96A',
  goldDim: '#8B6E2E',     goldBorder: 'rgba(201,168,76,.22)',
  ocean: '#0A6B5C',       oceanMid: '#0D9080',   oceanLight: '#1CBF9F',
  oceanFaint: 'rgba(13,144,128,.10)',
  text: '#D4C4A0',        textMuted: '#7A6A50',
}
```

### Ambient Orb Colors (used on all screens)
- **Gold orb**: `radial-gradient(circle, rgba(201,168,76,.10–.18) 0%, transparent 70%)`
- **Teal orb**: `radial-gradient(circle, rgba(13,144,128,.09–.16) 0%, transparent 70%)`
- **Brown center**: `radial-gradient(ellipse, rgba(61,26,8,.20–.35) 0%, transparent 70%)`
- Landing page uses highest opacity; app screens use slightly lower opacity

---

## Data Model

### Firestore Collections
```
users/{uid}/resumes/{docId}
  ├── name: string
  ├── resume: ResumeData       ← full object from types/resume.ts
  ├── createdAt: Timestamp
  └── updatedAt: Timestamp

passwordResets/{email}         ← OTP reset flow (TTL: 10 min)
  ├── code: string             ← 6-digit numeric string
  ├── createdAt: Timestamp
  ├── expiresAt: Timestamp
  └── verified: boolean
```

### Key TypeScript Interfaces (types/resume.ts)
- `ResumeData` — top-level container for everything
- `PersonalInfo` — name, email, phone, location, website, linkedin, summary, photo
- `ExperienceItem` / `EducationItem` / `ProjectItem` / `CertificationItem`
- `SkillGroup` → `SkillItem[]` (level 0-100)
- `LanguageItem` (proficiency: Native | Fluent | Advanced | Intermediate | Basic)
- `ResumeSection` — id, type, title, visible (controls sidebar order)
- `TypographySettings` — fontSize, lineHeight, letterSpacing, fontFamily
- `TemplateId` — `'modern-gradient' | 'ats-classic' | 'ats-minimal' | 'professional' | 'creative' | 'technical' | 'executive' | 'academic'`
- `PageSize` — `'A4' | 'Letter' | 'Legal' | 'A3' | 'A5'`

### Constants (all in types/resume.ts)
- `COLOR_THEMES[]` — 10 preset accent colors
- `INDUSTRIES[]` — 10 industry categories
- `TEMPLATES[]` — 8 template metadata entries
- `FONT_FAMILIES[]` — 8 font options (DM Sans, Inter, Georgia, Roboto, Open Sans, Lato, Montserrat, Playfair Display)
- `PAGE_SIZES[]` — 5 page size configs with mm dimensions
- `DEFAULT_RESUME` — full sample resume object

---

## Authentication Flow

1. Unauthenticated users see `<LandingPage />` (inside `HomeShell`) on `/`
2. Sign-in links go to `/login` → `<AuthGate />`
3. After email sign-in: `router.push('/')` (in AuthGate)
4. After Google OAuth: NextAuth handles callback → `/` automatically
5. `useAuth()` hook (from `AuthContext.tsx`) provides `{ user, loading }` everywhere
6. API routes authenticate via `getServerSession(authOptions)` — uid from `session.user.id`

### Providers
- **Google OAuth** — `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
- **Credentials** — email/password validated against Firebase Identity Toolkit REST API

### Password Reset Flow (OTP-based)
`AuthGate` has 5 modes: `signin` → `signup` | `forgot` → `verify-code` → `new-password`

1. `forgot` — POST `/api/auth/forgot-password`: generates 6-digit code, stores in `passwordResets/{email}` (10 min TTL), sends via Resend
2. `verify-code` — POST `/api/auth/verify-reset-code`: checks code, marks `verified: true`
3. `new-password` — POST `/api/auth/reset-password`: calls `adminAuth().updateUser()`, deletes Firestore doc
- Rate limited: 1 code request per email per minute
- Non-existent emails silently succeed (prevents account enumeration)

---

## Key Component Notes

### HomeShell.tsx
- Wraps everything in `SessionProvider` + `AuthProvider`
- `Shell` component: shows `<LandingPage />` if unauth, `<ResumeBuilder />` if auth
- `LandingPage`: full marketing page — Hero, How It Works, Features, Templates, FAQ, **Contact**, CTA, Footer
- `ContactForm`: client component inside `LandingPage`; posts to `/api/contact`; shows success state on send

### AuthGate.tsx
- 5 modes: `signin` | `signup` | `forgot` | `verify-code` | `new-password`
- "Forgot password?" link appears on sign-in mode only
- "Resend" link appears on verify-code mode
- All password reset steps share the same `email` state — no re-entry needed

### ResumeBuilder.tsx
- Owns entire resume state (`useState<ResumeData>`)
- Auto-save: debounced 1.5 s after any change; save state machine: `idle → saving → saved | error`
- Welcome modal on first load for color picker
- Page size selector in top bar; triggers re-render of preview
- `handleSave()` — POST (new) or PUT (existing) to `/api/resumes`
- `handleNew()` — resets state to `DEFAULT_RESUME`
- `handleOpenDoc(id)` — fetches resume by id from API
- `ResumePicker` sub-component: shown to returning users on load; lets them open an existing resume or start new
- Preview panel uses `relative overflow-hidden` wrapper with `absolute` orbs + inner `overflow-auto` scroller

### Sidebar.tsx
- Collapsed (icon rail) / expanded (icon + label) states
- 11 section panels: personal, experience, education, skills, projects, certifications, languages, interests, appearance, templates, sections
- Drag-and-drop: dnd-kit `DndContext` + `SortableContext` + `useSortable`
- Smart textarea: Ctrl+B inserts `• `, Enter after bullet auto-continues
- Appearance panel writes directly to localStorage + calls `onAccentColorChange()`

### ResumePreview.tsx
- `forwardRef` — ref passed to `react-to-print`
- Multi-page: white page divs sized in mm (`210mm × 297mm` for A4)
- PageHeader / PageFooter bands (sidebar-aware: splits into accent + white for sidebar templates)
- `zoom` CSS property (not `transform: scale`) for responsive preview — 0.45 to 0.85 at breakpoints; 1 on print

### lib/mailer.ts
- Uses Resend SDK (`new Resend(process.env.RESEND_API_KEY)`)
- `sendPasswordResetCode(to, code)` — branded HTML email with large code display
- `sendContactMessage(name, email, message)` — sends to `CONTACT_EMAIL` with `replyTo` set to sender

### Templates
Each template in `src/components/templates/` accepts `TemplateProps` from `shared.tsx` and renders conditionally based on section visibility. The `index.ts` exports a `TEMPLATE_MAP` keyed by `TemplateId`.

---

## Environment Variables
```
# Firebase Admin (server only)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=        # include \n newlines as-is

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# NextAuth
NEXTAUTH_SECRET=             # openssl rand -base64 32
NEXTAUTH_URL=                # http://localhost:3000 or https://www.bfox.pro

# Firebase Web (server-side only — email/password auth via Identity Toolkit)
FIREBASE_WEB_API_KEY=

# Resend (email delivery — password reset + contact form)
RESEND_API_KEY=              # from resend.com → API Keys
RESEND_FROM=                 # e.g. "BrandFox <noreply@bfox.pro>" — domain must be verified in Resend
CONTACT_EMAIL=               # inbox that receives contact form submissions
```

---

## Animations (globals.css)
| Class | Keyframe | Purpose | Used on |
|---|---|---|---|
| `.anim-orb` | `orbDrift` 14s | Ambient background orb (gold) | All screens |
| `.anim-orb-slow` | `orbDrift` 20s reverse | Ambient background orb (teal) | All screens |
| `.anim-badge` | `floatY` 4s | Floating badge | Landing hero |
| `.anim-hero` | `fadeInUp` 0.8s | Hero text entrance | Landing hero |
| `.anim-hero-delay` | `fadeInUp` 0.8s 0.2s | Delayed hero element | Landing hero |
| `.anim-hero-d2` | `fadeInUp` 0.8s 0.4s | Further delayed element | Landing hero |
| `.anim-glow` | `glowPulse` 2.8s | CTA button glow | Landing CTAs |
| `.anim-shimmer` | `shimmerText` 4s | Gold shimmer gradient text | Landing hero |
| `.card-reveal` | `cardReveal` 0.7s | Feature card entrance | Landing features |

Orb pattern used on **every screen** (AuthGate, ResumePicker, loading state, main editor preview panel, privacy page, landing page). Orbs are `pointer-events-none` and hidden on print via `.no-print`.

---

## Common Tasks Quick Reference

**Add a new template:**
1. Create `src/components/templates/MyTemplate.tsx` implementing `TemplateProps`
2. Add to `src/components/templates/index.ts` `TEMPLATE_MAP`
3. Add entry to `TEMPLATES` constant in `src/types/resume.ts`
4. Add entry to `TemplateId` union type

**Add a new resume section type:**
1. Add to `SectionType` union in `types/resume.ts`
2. Add data interface + field to `ResumeData`
3. Add panel component inside `Sidebar.tsx`
4. Update all template components to render the new section

**Change accent color globally:**
Update `--accent-rgb` in `globals.css` `:root`. The value is space-separated RGB channels (not hex, not `rgb()`).

**PDF export:**
Uses `react-to-print` — the print button in `ResumeBuilder.tsx` calls the ref attached to `<ResumePreview />`. Print styles in `globals.css` set `zoom: 1 !important` and hide `.no-print` elements.

**Send a transactional email:**
Use `sendPasswordResetCode()` or `sendContactMessage()` from `src/lib/mailer.ts`. Both use the Resend SDK. Requires `RESEND_API_KEY` and `RESEND_FROM` env vars.
