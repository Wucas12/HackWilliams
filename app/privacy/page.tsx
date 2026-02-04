import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Saturday.solutions',
  description: 'Privacy policy for Saturday.solutions — how we collect, use, and protect your data.',
};

const sectionTitle: React.CSSProperties = { fontFamily: "'Canela Text', serif", fontWeight: 400, color: 'rgb(80, 0, 130)', fontSize: '1.25rem', marginTop: '1.5rem', marginBottom: '0.5rem' };
const bodyText: React.CSSProperties = { fontFamily: "'Canela Text', serif", color: '#374151', lineHeight: 1.6, fontSize: '0.9375rem' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Canela Text', serif" }}>
      <header className="border-b border-gray-200 bg-white/95 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-light hover:opacity-80 transition-opacity"
            style={{ color: 'rgb(80, 0, 130)' }}
          >
            Saturday.solutions
          </Link>
          <nav className="flex gap-6 text-sm">
            <Link href="/terms" className="hover:underline" style={{ color: '#6b7280' }}>
              Terms of Service
            </Link>
            <Link href="/" className="hover:underline" style={{ color: '#6b7280' }}>
              Home
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 md:py-14">
        <h1 className="text-3xl md:text-4xl font-light mb-2" style={{ color: 'rgb(80, 0, 130)' }}>
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: February 2026</p>

        <section className="mb-8">
          <h2 style={sectionTitle}>1. Introduction</h2>
          <p style={bodyText}>
            Saturday.solutions (&quot;we,&quot; &quot;our,&quot; or &quot;the service&quot;) is a scheduling and calendar tool that helps you turn syllabi and natural language into calendar events. This Privacy Policy explains how we collect, use, store, and protect your information when you use our service, including when you sign in with Google.
          </p>
        </section>

        <section className="mb-8">
          <h2 style={sectionTitle}>2. Information We Collect</h2>
          <p style={bodyText}>
            We collect information necessary to provide the service:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1" style={bodyText}>
            <li><strong>Google account data:</strong> When you sign in with Google, we receive your email address, name, and profile information as provided by Google.</li>
            <li><strong>Calendar data:</strong> We access your Google Calendar to read and create events (e.g., from syllabi you upload). We do not sell or share your calendar data with third parties for advertising.</li>
            <li><strong>Content you provide:</strong> Syllabus PDFs you upload and any text you enter in the app. This data is used only to fulfill the features you use (e.g., parsing events).</li>
            <li><strong>Technical data:</strong> We may log general usage (e.g., errors, API usage) to operate and improve the service. We do not track you across other websites for advertising.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 style={sectionTitle}>3. How We Use Your Information</h2>
          <p style={bodyText}>
            We use your information to:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1" style={bodyText}>
            <li>Authenticate you and link your Google account to the service.</li>
            <li>Read and write calendar events (e.g., from syllabus PDFs) on your behalf.</li>
            <li>Process syllabus PDFs with AI to extract event details and sync them to your calendar.</li>
            <li>Improve the service, fix bugs, and comply with legal obligations.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 style={sectionTitle}>4. Third-Party Services</h2>
          <p style={bodyText}>
            Our service uses:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1" style={bodyText}>
            <li><strong>Google APIs:</strong> We use Google OAuth and Google Calendar (and related APIs such as Free/Busy and People/Directory where applicable) in accordance with the&nbsp;
              <a href="https://developers.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'rgb(80, 0, 130)' }}>Google API Terms of Service</a>
              &nbsp;and&nbsp;
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'rgb(80, 0, 130)' }}>Google Privacy Policy</a>.
            </li>
            <li><strong>OpenAI:</strong> We may send syllabus text to OpenAI to parse event content. OpenAI&apos;s use of data is governed by their&nbsp;
              <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'rgb(80, 0, 130)' }}>Privacy Policy</a>.
            </li>
          </ul>
          <p style={{ ...bodyText, marginTop: '0.75rem' }}>
            We do not sell your personal information to third parties.
          </p>
        </section>

        <section className="mb-8">
          <h2 style={sectionTitle}>5. Data Retention and Security</h2>
          <p style={bodyText}>
            We retain your Google tokens and session data only as long as needed to provide the service. You can revoke our access at any time via your&nbsp;
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'rgb(80, 0, 130)' }}>Google Account permissions</a>.
            Uploaded PDFs are processed in real time; we do not retain them longer than necessary for the operation of the feature. We use industry-standard practices to protect data in transit and restrict access to your information.
          </p>
        </section>

        <section className="mb-8">
          <h2 style={sectionTitle}>6. Your Rights</h2>
          <p style={bodyText}>
            You may:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1" style={bodyText}>
            <li>Revoke Saturday.solutions&apos;s access to your Google account (Calendar, profile, etc.) at any time from Google Account settings.</li>
            <li>Stop using the service; we will not continue to access your data after you revoke access.</li>
            <li>Contact us (see below) to ask about the data we hold or to request deletion where applicable.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 style={sectionTitle}>7. Children</h2>
          <p style={bodyText}>
            The service is not directed at children under 13. We do not knowingly collect personal information from children under 13.
          </p>
        </section>

        <section className="mb-8">
          <h2 style={sectionTitle}>8. Changes</h2>
          <p style={bodyText}>
            We may update this Privacy Policy from time to time. We will post the updated policy on this page and update the &quot;Last updated&quot; date. Continued use of the service after changes constitutes acceptance of the revised policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 style={sectionTitle}>9. Contact</h2>
          <p style={bodyText}>
            For questions about this Privacy Policy or our data practices, please contact us at the email address you use for the project or support (e.g., the contact listed in the Google Cloud Console OAuth consent screen or on the Saturday.solutions website).
          </p>
        </section>

        <div className="pt-8 border-t border-gray-200">
          <Link href="/" className="inline-block text-sm underline" style={{ color: 'rgb(80, 0, 130)' }}>
            ← Back to Home
          </Link>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-6 mt-8">
        <div className="max-w-3xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
          <span>© 2026 Saturday.solutions</span>
          <Link href="/privacy" className="hover:underline" style={{ color: 'rgb(80, 0, 130)' }}>Privacy Policy</Link>
          <Link href="/terms" className="hover:underline" style={{ color: 'rgb(80, 0, 130)' }}>Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
}
