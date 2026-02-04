import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | Saturday.solutions',
  description: 'Terms of service for Saturday.solutions — your agreement to use the service.',
};

const sectionTitle: React.CSSProperties = { fontFamily: "'Canela Text', serif", fontWeight: 400, color: 'rgb(80, 0, 130)', fontSize: '1.25rem', marginTop: '1.5rem', marginBottom: '0.5rem' };
const bodyText: React.CSSProperties = { fontFamily: "'Canela Text', serif", color: '#374151', lineHeight: 1.6, fontSize: '0.9375rem' };

export default function TermsPage() {
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
            <Link href="/privacy" className="hover:underline" style={{ color: '#6b7280' }}>
              Privacy Policy
            </Link>
            <Link href="/" className="hover:underline" style={{ color: '#6b7280' }}>
              Home
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 md:py-14">
        <h1 className="text-3xl md:text-4xl font-light mb-2" style={{ color: 'rgb(80, 0, 130)' }}>
          Terms of Service
        </h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: February 2026</p>

        <section className="mb-8">
          <h2 style={sectionTitle}>1. Acceptance of Terms</h2>
          <p style={bodyText}>
            By accessing or using Saturday.solutions (&quot;the service&quot;), you agree to be bound by these Terms of Service and our&nbsp;
            <Link href="/privacy" className="underline" style={{ color: 'rgb(80, 0, 130)' }}>Privacy Policy</Link>.
            If you do not agree, do not use the service.
          </p>
        </section>

        <section className="mb-8">
          <h2 style={sectionTitle}>2. Description of Service</h2>
          <p style={bodyText}>
            Saturday.solutions provides tools to (1) turn syllabus PDFs and natural language into calendar events and sync them to Google Calendar, and (2) book meetings with other users by checking availability and sending calendar invites. The service uses Google sign-in and Google Calendar (and related Google APIs) and may use third-party AI services (e.g., OpenAI) to process content you provide.
          </p>
        </section>

        <section className="mb-8">
          <h2 style={sectionTitle}>3. Your Account and Google Sign-In</h2>
          <p style={bodyText}>
            You must sign in with a valid Google account to use the service. You are responsible for maintaining the security of your Google account. By signing in, you authorize Saturday.solutions to access your Google profile, email, and calendar (and other scopes we request) in accordance with our Privacy Policy and Google&apos;s policies. You may revoke our access at any time via your&nbsp;
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'rgb(80, 0, 130)' }}>Google Account permissions</a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 style={sectionTitle}>4. Acceptable Use</h2>
          <p style={bodyText}>
            You agree to use the service only for lawful purposes and in a way that does not infringe the rights of others or restrict their use of the service. You must not:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1" style={bodyText}>
            <li>Use the service to harass, spam, or send unsolicited or misleading invitations.</li>
            <li>Upload content (e.g., syllabi) that you do not have the right to use or that violates applicable law.</li>
            <li>Attempt to gain unauthorized access to the service, other users&apos; accounts, or any systems or data.</li>
            <li>Use the service in any way that could damage, disable, or overburden the service or its providers.</li>
          </ul>
          <p style={{ ...bodyText, marginTop: '0.75rem' }}>
            We may suspend or terminate your access if we reasonably believe you have violated these terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 style={sectionTitle}>5. Your Content</h2>
          <p style={bodyText}>
            You retain ownership of content you upload or submit (e.g., PDFs, meeting text). By using the service, you grant us the limited rights necessary to operate the service (e.g., to process your content with AI, read/write your calendar, send invites). We do not claim ownership of your content or use it for purposes unrelated to providing the service, as described in our Privacy Policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 style={sectionTitle}>6. Disclaimers</h2>
          <p style={bodyText}>
            The service is provided &quot;as is&quot; and &quot;as available.&quot; We do not guarantee that the service will be error-free, uninterrupted, or that AI-generated content (e.g., parsed events, invitation text) will be accurate or complete. You are responsible for reviewing and verifying any events or invites before they are synced or sent. We are not liable for any loss or damage arising from your use of the service or reliance on AI-generated output.
          </p>
        </section>

        <section className="mb-8">
          <h2 style={sectionTitle}>7. Limitation of Liability</h2>
          <p style={bodyText}>
            To the maximum extent permitted by law, Saturday.solutions and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data, revenue, or profits, arising from your use or inability to use the service. Our total liability shall not exceed the amount you paid to use the service in the twelve months preceding the claim (or zero if the service was free).
          </p>
        </section>

        <section className="mb-8">
          <h2 style={sectionTitle}>8. Third-Party Services</h2>
          <p style={bodyText}>
            The service depends on Google APIs and may use other third parties (e.g., OpenAI). Your use of those services is subject to their respective terms and policies. We are not responsible for the availability, performance, or policies of third-party services.
          </p>
        </section>

        <section className="mb-8">
          <h2 style={sectionTitle}>9. Changes</h2>
          <p style={bodyText}>
            We may update these Terms of Service from time to time. We will post the updated terms on this page and update the &quot;Last updated&quot; date. Continued use of the service after changes constitutes acceptance of the revised terms. If you do not agree, you must stop using the service.
          </p>
        </section>

        <section className="mb-8">
          <h2 style={sectionTitle}>10. Contact</h2>
          <p style={bodyText}>
            For questions about these Terms of Service, please contact us at the email address provided for the project or support (e.g., the contact listed in the Google Cloud Console OAuth consent screen or on the Saturday.solutions website).
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
