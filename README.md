# BrandFox — Resume Builder

A professional resume builder with cloud storage, real-time preview, 8 export-ready templates, password reset, and contact form. Built with Next.js 15 and Firebase.

**Live**: https://www.bfox.pro

---

## Features

- **8 resume templates** — ATS-safe, creative, executive, technical, and more
- **Real-time preview** — see changes instantly as you type
- **PDF export** — high-fidelity export via browser print (A4, Letter, Legal, A3, A5)
- **Cloud sync** — resumes saved to your account, accessible from any device
- **Drag-and-drop** — reorder sections and items freely
- **Custom theming** — 10 accent color presets + custom color picker
- **Typography controls** — font family, size, line height, letter spacing
- **Industry-filtered templates** — filter by tech, finance, design, etc.
- **Google & email sign-in** — Google OAuth or email/password
- **Forgot password** — OTP code sent via email; verify and set a new password in-app
- **Contact form** — on the landing page; messages delivered to the manager via Resend

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.5 |
| Styling | Tailwind CSS 3.4 |
| Auth | NextAuth v4 (Google OAuth + Credentials) |
| Database | Firebase Firestore (via Admin SDK) |
| Email | Resend |
| Drag & Drop | dnd-kit |
| PDF Export | react-to-print |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase project with Firestore enabled
- Google OAuth credentials (for Google sign-in)
- Resend account (for password reset and contact emails)

### 1. Clone and install
```bash
git clone <repo-url>
cd CV_Builder
npm install
```

### 2. Set environment variables
Copy `.env.local.example` to `.env.local` and fill in:
```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Firebase Web API (for email/password auth)
FIREBASE_WEB_API_KEY=your-web-api-key

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# NextAuth
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# Resend (email delivery)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
RESEND_FROM=BrandFox <noreply@yourdomain.com>   # domain must be verified in Resend
CONTACT_EMAIL=you@example.com                   # receives contact form messages
```

### 3. Run development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

> **Resend testing**: Use `RESEND_FROM=BrandFox <onboarding@resend.dev>` to send without a verified domain, but only to your own Resend-verified email address.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Root — delegates to <HomeShell />
│   ├── login/page.tsx        # Sign-in / sign-up / forgot-password page
│   ├── privacy/page.tsx      # Privacy policy
│   ├── globals.css           # Global styles, CSS variables, animations
│   └── api/
│       ├── auth/             # NextAuth + signup + password-reset endpoints
│       │   ├── forgot-password/    # Generate OTP, store in Firestore, send email
│       │   ├── verify-reset-code/  # Validate OTP, mark verified
│       │   └── reset-password/     # Update Firebase password, delete OTP doc
│       ├── contact/          # Contact form → sends email via Resend
│       └── resumes/          # CRUD endpoints for saved resumes
├── components/
│   ├── HomeShell.tsx         # App shell + full landing page (incl. ContactForm)
│   ├── ResumeBuilder.tsx     # Main editor — state, save, layout, ResumePicker
│   ├── Sidebar.tsx           # All section editors (personal, experience, etc.)
│   ├── ResumePreview.tsx     # Live template preview + print target
│   ├── DocumentsPanel.tsx    # Resume picker modal
│   ├── AuthGate.tsx          # Auth form — signin, signup, forgot, verify, reset
│   └── templates/            # 8 resume template components
├── lib/
│   ├── auth.ts               # Client auth helpers
│   ├── auth-options.ts       # NextAuth provider config
│   ├── AuthContext.tsx        # useAuth() hook
│   ├── firebase-admin.ts     # Server-side Firebase init
│   ├── mailer.ts             # Resend email client (password reset + contact)
│   └── resumes.ts            # API fetch wrappers
└── types/
    └── resume.ts             # All TypeScript interfaces + constants
```

---

## Resume Templates

| Template | Description |
|---|---|
| Modern Gradient | Bold colored header with accent gradient |
| ATS Classic | Single-column, serif, ATS-safe |
| ATS Minimal | Clean with subtle accent underline |
| Professional | Two-column with sidebar |
| Creative | Left accent sidebar with photo |
| Technical | Skills and projects forward |
| Executive | Centered serif, refined spacing |
| Academic | Publication and research focused |

---

## Data Storage

Resumes are stored in Firestore under:
```
users/{uid}/resumes/{docId}
  ├── name: string
  ├── resume: ResumeData    ← full resume object
  ├── createdAt: Timestamp
  └── updatedAt: Timestamp
```

Password reset OTPs are stored temporarily under:
```
passwordResets/{email}
  ├── code: string          ← 6-digit numeric OTP
  ├── createdAt: Timestamp
  ├── expiresAt: Timestamp  ← 10 minutes after creation
  └── verified: boolean
```

All user data access is gated by Firebase Security Rules.

---

## Deployment

### Google OAuth Setup (required)
1. Add your production domain to **Authorized JavaScript origins**: `https://www.bfox.pro`
2. Add the callback URL to **Authorized redirect URIs**: `https://www.bfox.pro/api/auth/callback/google`
3. Update `NEXTAUTH_URL=https://www.bfox.pro` in production environment

### Resend Setup (required for email)
1. Create an account at [resend.com](https://resend.com)
2. Verify your sending domain (DNS records)
3. Create an API key and set `RESEND_API_KEY` in your environment
4. Set `RESEND_FROM` to an address on your verified domain
5. Set `CONTACT_EMAIL` to the inbox that should receive contact form messages

### Production Build
```bash
npm run build
npm start
```

---

## Development Notes

- **No TypeScript errors**: run `npm run build` to verify before committing
- **Accent color**: stored in `localStorage` as hex, converted to `--accent-rgb` CSS var at runtime
- **PDF zoom**: uses CSS `zoom` property (not `transform: scale`) so multi-page layout dimensions are correct
- **Auto-save**: triggers 1.5 s after any change; unsaved changes block navigation
- **Password reset**: OTPs expire in 10 min; rate-limited to 1 request/email/minute; non-existent emails silently succeed to prevent account enumeration

---

## Privacy

See [Privacy Policy](https://www.bfox.pro/privacy) — short version: no ads, no tracking, no selling data. Resume content is yours.

Contact: brandfoxpro@gmail.com
