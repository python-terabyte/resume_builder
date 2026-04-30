# BrandFox — Claude Code Guide

## Project Identity
- **App name**: BrandFox (was "Resume Builder" — never revert)
- **Domain**: https://www.bfox.pro (production) / http://localhost:3000 (dev)
- **Stack**: Next.js 15 · TypeScript · Tailwind CSS 3.4 · NextAuth v4 · Firebase Admin · Firestore

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
│   ├── page.tsx                  # LandingPage (unauth) + Shell (auth)
│   ├── layout.tsx                # Root layout + metadata
│   ├── globals.css               # CSS vars, keyframes, utility classes
│   ├── login/page.tsx            # Auth page → <AuthGate />
│   ├── privacy/page.tsx          # Privacy policy
│   └── api/
│       ├── auth/[...nextauth]/   # NextAuth handler
│       ├── auth/signup/          # Email sign-up endpoint
│       └── resumes/              # GET/POST list; [id] PUT/PATCH/DELETE
├── components/
│   ├── ResumeBuilder.tsx         # 657 lines — main editor orchestrator
│   ├── Sidebar.tsx               # 1561 lines — all 11 section editors
│   ├── ResumePreview.tsx         # Template renderer + print target
│   ├── DocumentsPanel.tsx        # Resume picker/manager modal
│   ├── AuthGate.tsx              # Sign-in / sign-up form
│   └── templates/                # 8 resume template components + index.ts
├── lib/
│   ├── auth.ts                   # signInEmail, signUpEmail, signInGoogle, signOut
│   ├── auth-options.ts           # NextAuth config (Google + Credentials providers)
│   ├── AuthContext.tsx           # useAuth() hook → { user, loading }
│   ├── firebase-admin.ts         # adminApp(), adminAuth(), adminDb()
│   └── resumes.ts                # Client-side API helpers (fetch wrappers)
└── types/
    ├── resume.ts                 # All interfaces + constants (388 lines)
    └── next-auth.d.ts            # Augments session with user.id (Firebase uid)
```

---

## Color & Theme System

### CSS Variables (`globals.css` `:root`)
```css
--bg-primary:   #09070E   /* deep obsidian — main app background */
--bg-secondary: #150F23   /* rich purple-dark — cards, panels */
--bg-tertiary:  #1E1635   /* medium purple — inputs, avatars */
--accent-rgb:   201 168 76  /* gold — used as rgb(var(--accent-rgb)) */
```
The accent color is **dynamic** — users can override it via the Appearance panel (stored in localStorage as `accentColor` hex and converted to `--accent-rgb` in `ResumeBuilder.tsx`).

### Tailwind `accent` Token (tailwind.config.ts)
```ts
accent: 'rgb(var(--accent-rgb) / <alpha-value>)'
```
Use `bg-accent`, `text-accent`, `border-accent`, `focus:ring-accent` anywhere.

### Landing Page Colors (page.tsx inline `C` object)
```ts
const C = {
  matteDeep: '#070809',   chocMid: '#3D1A08',
  gold: '#C9A84C',        goldLight: '#E8C96A',
  ocean: '#0A6B5C',       oceanLight: '#1CBF9F',
  text: '#E8DDD0',        muted: '#9B8B7A',
}
```

### Builder UI Color Map
| Element | Class / Value |
|---|---|
| App background | `bg-[#09070E]` or `var(--bg-primary)` |
| Cards, panels | `bg-[#150F23]` |
| Inputs, avatars | `bg-[#09070E]` (input bg) |
| Borders | `border-[rgba(201,168,76,.15)]` (light) / `.22` (medium) |
| Gold accent | `text-[#C9A84C]` / `bg-[#C9A84C]` |
| Dirty/unsaved dot | `bg-[#C9A84C]` |

---

## Data Model

### Firestore Path
```
users/{uid}/resumes/{docId}
  ├── name: string
  ├── resume: ResumeData       ← full object from types/resume.ts
  ├── createdAt: Timestamp
  └── updatedAt: Timestamp
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

1. Unauthenticated users see `<LandingPage />` on `/`
2. Sign-in links go to `/login` → `<AuthGate />`
3. After email sign-in: `router.push('/')` (in AuthGate)
4. After Google OAuth: NextAuth handles callback → `/` automatically
5. `useAuth()` hook (from `AuthContext.tsx`) provides `{ user, loading }` everywhere
6. API routes authenticate via `getServerSession(authOptions)` — uid comes from `session.user.id`

### Providers
- **Google OAuth** — `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
- **Credentials** — email/password validated against Firebase Identity Toolkit REST API

---

## Key Component Notes

### ResumeBuilder.tsx (657 lines)
- Owns entire resume state (`useState<ResumeData>`)
- Auto-save: debounced 1.5 s after any change; save state machine: `idle → saving → saved | error`
- Welcome modal on first load for color picker
- Accordion-style section list in left nav
- Page size selector in top bar; triggers re-render of preview
- `handleSave()` — POST (new) or PUT (existing) to `/api/resumes`
- `handleNew()` — resets state to `DEFAULT_RESUME`
- `handleOpenDoc(id)` — fetches resume by id from API

### Sidebar.tsx (1561 lines)
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

# Firebase Web (client-side, if used)
FIREBASE_WEB_API_KEY=
```

---

## Animations (globals.css)
| Class | Keyframe | Purpose |
|---|---|---|
| `.anim-orb` | `orbDrift` 14s | Ambient background orbs |
| `.anim-orb-slow` | `orbDrift` 20s reverse | Slower orb variant |
| `.anim-badge` | `floatY` 4s | Floating badge on landing |
| `.anim-hero` | `fadeInUp` 0.8s | Hero text entrance |
| `.anim-hero-delay` | `fadeInUp` 0.8s 0.2s | Delayed hero element |
| `.anim-hero-d2` | `fadeInUp` 0.8s 0.4s | Further delayed hero element |
| `.anim-glow` | `glowPulse` 2.8s | CTA button glow |
| `.anim-shimmer` | `shimmerText` 4s | Gold shimmer gradient text |
| `.card-reveal` | `cardReveal` 0.7s | Feature card entrance |

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
