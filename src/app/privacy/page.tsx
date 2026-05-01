import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — BrandFox',
}

export default function PrivacyPolicy() {
  const lastUpdated = 'April 27, 2026'

  return (
    <div className="relative min-h-screen bg-[#120B07] px-4 py-8 font-sans text-slate-300 sm:py-12">

      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="anim-orb absolute rounded-full" style={{ width: 580, height: 580, top: -160, right: -140, background: 'radial-gradient(circle, rgba(201,168,76,.14) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="anim-orb-slow absolute rounded-full" style={{ width: 460, height: 460, bottom: -120, left: -120, background: 'radial-gradient(circle, rgba(13,144,128,.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute rounded-full" style={{ width: 600, height: 260, top: '50%', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(ellipse, rgba(61,26,8,.28) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl">

        {/* Back link */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to BrandFox
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: {lastUpdated}</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">

          <Section title="Overview">
            <p>
              BrandFox is a tool that lets you create, edit, and export professional resumes.
              We take your privacy seriously. This policy explains what information we collect, why
              we collect it, and how we protect it.
            </p>
          </Section>

          <Section title="Information We Collect">
            <p>We collect only what is necessary to provide the service:</p>
            <ul className="mt-3 space-y-2 pl-4">
              <Li><strong className="text-white">Account information</strong> — your name and email address, provided when you sign up or sign in with Google.</Li>
              <Li><strong className="text-white">Resume data</strong> — the content you enter into your resumes (personal details, work history, education, skills, etc.). This is stored securely in your personal account.</Li>
              <Li><strong className="text-white">Usage data</strong> — basic server logs (IP address, timestamps) generated automatically by our hosting infrastructure. We do not use analytics trackers or ad networks.</Li>
            </ul>
          </Section>

          <Section title="How We Use Your Information">
            <ul className="space-y-2 pl-4">
              <Li>To authenticate you and provide access to your saved resumes.</Li>
              <Li>To store and sync your resume data across devices.</Li>
              <Li>To restore your session when you return to the app.</Li>
            </ul>
            <p className="mt-3">
              We do not sell, rent, or share your personal data with third parties for marketing
              purposes. We do not use your resume content to train AI models or for any purpose
              other than displaying it back to you.
            </p>
          </Section>

          <Section title="Data Storage and Security">
            <p>
              Your resume data is stored in Google Firebase Firestore, a cloud database provided
              by Google LLC. Authentication is handled server-side and your credentials are never
              exposed to the browser. Sessions are managed via secure, HTTP-only cookies.
            </p>
            <p className="mt-3">
              Access to your data is restricted to your authenticated account. Firebase Security
              Rules ensure no other user can read or write your resumes.
            </p>
          </Section>

          <Section title="Third-Party Services">
            <p>We use the following third-party services to operate the app:</p>
            <ul className="mt-3 space-y-2 pl-4">
              <Li>
                <strong className="text-white">Google Firebase</strong> — database and authentication infrastructure.{' '}
                <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline hover:text-indigo-300">
                  Firebase Privacy Policy
                </a>
              </Li>
              <Li>
                <strong className="text-white">Google OAuth</strong> — optional sign-in with your Google account. If you use this option, Google shares your name, email address, and profile picture with us.{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline hover:text-indigo-300">
                  Google Privacy Policy
                </a>
              </Li>
            </ul>
          </Section>

          <Section title="Cookies and Local Storage">
            <p>We use:</p>
            <ul className="mt-3 space-y-2 pl-4">
              <Li><strong className="text-white">HTTP-only session cookie</strong> — to keep you signed in. This cookie is not accessible to JavaScript and expires when your session ends.</Li>
              <Li><strong className="text-white">Browser localStorage</strong> — to remember your chosen theme color between visits. No personal data is stored here.</Li>
            </ul>
            <p className="mt-3">We do not use advertising cookies or third-party tracking cookies.</p>
          </Section>

          <Section title="Your Rights">
            <p>You have the right to:</p>
            <ul className="mt-3 space-y-2 pl-4">
              <Li><strong className="text-white">Access your data</strong> — all your resume data is visible and editable directly within the app.</Li>
              <Li><strong className="text-white">Delete your data</strong> — you can delete individual resumes from within the app at any time. To delete your account and all associated data, contact us at the email below.</Li>
              <Li><strong className="text-white">Export your data</strong> — you can export any resume as a PDF at any time using the Export PDF button.</Li>
            </ul>
          </Section>

          <Section title="Data Retention">
            <p>
              Your account and resume data are retained for as long as your account is active.
              If you request account deletion, all your data will be permanently removed within
              30 days.
            </p>
          </Section>

          <Section title="Children's Privacy">
            <p>
              This service is not directed at children under the age of 13. We do not knowingly
              collect personal information from children. If you believe a child has provided us
              with personal information, please contact us and we will delete it promptly.
            </p>
          </Section>

          <Section title="Changes to This Policy">
            <p>
              We may update this policy from time to time. When we do, we will update the
              "Last updated" date at the top of this page. Continued use of the service after
              changes are posted constitutes acceptance of the updated policy.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              If you have questions about this privacy policy or want to request data deletion,
              contact us at{' '}
              <a href="mailto:asimsaleem.net@gmail.com" className="text-indigo-400 underline hover:text-indigo-300">
                asimsaleem.net@gmail.com
              </a>.
            </p>
          </Section>

        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-slate-600">
          &copy; {new Date().getFullYear()} BrandFox. All rights reserved.
        </div>
      </div>
    </div>
  )
}


function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-white sm:text-lg">{title}</h2>
      <div className="text-slate-400">{children}</div>
    </section>
  )
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
      <span>{children}</span>
    </li>
  )
}
