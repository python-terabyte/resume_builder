# BrandFox — Resume Builder

A professional resume builder with cloud storage, real-time preview, 8 export-ready templates, and PDF export. Built with Next.js 15 and Firebase.

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

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.5 |
| Styling | Tailwind CSS 3.4 |
| Auth | NextAuth v4 (Google OAuth + Credentials) |
| Database | Firebase Firestore (via Admin SDK) |
| Drag & Drop | dnd-kit |
| PDF Export | react-to-print |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase project with Firestore enabled
- Google OAuth credentials (for Google sign-in)

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
```

### 3. Run development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx            # Public landing page + authenticated app shell
│   ├── login/page.tsx      # Sign-in / sign-up page
│   ├── privacy/page.tsx    # Privacy policy
│   ├── globals.css         # Global styles, CSS variables, animations
│   └── api/
│       ├── auth/           # NextAuth + email signup endpoints
│       └── resumes/        # CRUD endpoints for saved resumes
├── components/
│   ├── ResumeBuilder.tsx   # Main editor — state, save, layout
│   ├── Sidebar.tsx         # All section editors (personal, experience, etc.)
│   ├── ResumePreview.tsx   # Live template preview + print target
│   ├── DocumentsPanel.tsx  # Resume picker modal
│   ├── AuthGate.tsx        # Sign-in / sign-up form UI
│   └── templates/          # 8 resume template components
├── lib/
│   ├── auth.ts             # Client auth helpers
│   ├── auth-options.ts     # NextAuth provider config
│   ├── AuthContext.tsx     # useAuth() hook
│   ├── firebase-admin.ts   # Server-side Firebase init
│   └── resumes.ts          # API fetch wrappers
└── types/
    └── resume.ts           # All TypeScript interfaces + constants
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

All access is gated by Firebase Security Rules — users can only read/write their own data.

---

## Deployment

### Google OAuth Setup (required)
1. Add your production domain to **Authorized JavaScript origins**: `https://www.bfox.pro`
2. Add the callback URL to **Authorized redirect URIs**: `https://www.bfox.pro/api/auth/callback/google`
3. Update `NEXTAUTH_URL=https://www.bfox.pro` in production environment

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

---

## Privacy

See [Privacy Policy](https://www.bfox.pro/privacy) — short version: no ads, no tracking, no selling data. Resume content is yours.

Contact: asimsaleem.net@gmail.com
