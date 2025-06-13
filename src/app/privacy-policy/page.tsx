
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ArrowLeft, ShieldCheck, Users, BarChart3, Cookie, Edit3, AlertCircle, Mail, Sparkles } from "lucide-react";

export default function PrivacyPolicyPage() {
  const lastUpdatedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 bg-background">
      <header className="mb-8 animate-fade-in text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <ShieldCheck className="h-10 w-10 text-primary" />
          <CardTitle className="text-3xl font-bold text-foreground">Privacy Policy for Cosmofy</CardTitle>
        </div>
        <CardDescription className="text-muted-foreground">Last updated: {lastUpdatedDate}</CardDescription>
      </header>
      <Card className="animate-fade-in animation-delay-200 shadow-xl max-w-3xl mx-auto w-full">
        <CardContent className="prose prose-invert max-w-none text-foreground/90 space-y-8 text-base leading-relaxed py-6">

          <section>
            <h2 className="text-2xl font-semibold flex items-center gap-2"><Users className="h-6 w-6 text-accent" />1. Introduction</h2>
            <p>Welcome to Cosmofy ("App", "we", "us", "our"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application Cosmofy. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold flex items-center gap-2"><BarChart3 className="h-6 w-6 text-accent" />2. Information We Collect</h2>
            <p>Cosmofy is designed to enhance your understanding and connection to the cosmos. The information we might process includes:</p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li><strong>Ask AI Queries:</strong> Questions you submit to the "Ask AI" feature are sent to our AI service provider to generate a response. We do not store these questions in association with any personal identifier on our servers long-term.</li>
              <li><strong>Usage Data:</strong> We may collect anonymous usage data to improve app functionality, such as feature popularity or error rates. This data is aggregated and anonymized, and helps us understand how to make Cosmofy better.</li>
              <li><strong>Location Data (Optional & With Consent):</strong> For features like personalized event timings (e.g., satellite passes in the Event Calendar, planetary positions), we will request your explicit consent to access your device's approximate location (latitude and longitude). This data is used solely for providing the requested service (e.g., calculating visibility from your location) and is not stored unnecessarily or shared without your consent. You can revoke this permission at any time through your browser or device settings.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold flex items-center gap-2"><Sparkles className="h-6 w-6 text-accent" />3. How We Use Your Information</h2>
            <p>We use the information collected solely for the following purposes:</p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>To provide and operate the App's features (e.g., generating AI explanations, calculating local event times).</li>
              <li>To improve the App's performance, user experience, and feature set based on anonymous usage data.</li>
              <li>To personalize content like event visibility and celestial body positions when location services are explicitly enabled by you.</li>
              <li>To communicate with you about app updates or important information, if you opt-in to such communications (feature not yet implemented).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold flex items-center gap-2"><Users className="h-6 w-6 text-accent" />4. Will Your Information Be Shared With Anyone?</h2>
            <p>We do not sell, trade, rent, or otherwise share your personal information with third parties for their marketing purposes.</p>
            <p>Information submitted to the "Ask AI" feature is processed by our AI service provider under their respective privacy policies. We encourage you to review their privacy policy for more details on how they handle data.</p>
            <p>Location data, if provided, is used to make requests to relevant astronomical APIs (like N2YO or AstronomyAPI) to fetch data specific to your coordinates. These APIs have their own privacy policies.</p>
            <p>We may disclose your information if required by law or in response to valid requests by public authorities (e.g., a court or a government agency).</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold flex items-center gap-2"><Cookie className="h-6 w-6 text-accent" />5. Cookies and Tracking Technologies</h2>
            <p>Cosmofy may use local storage in your browser to save preferences, such as your last used NORAD ID for spacecraft tracking. We do not use cookies or similar tracking technologies for user tracking across different websites or for advertising purposes. If this changes, this policy will be updated.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-accent" />6. Data Security</h2>
            <p>We aim to protect your information through a system of organizational and technical security measures. API keys and sensitive credentials are handled server-side where possible or stored securely if client-side access is necessary. However, please remember that no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee its absolute security.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold flex items-center gap-2"><AlertCircle className="h-6 w-6 text-accent" />7. Children's Privacy</h2>
            <p>Cosmofy is intended for a general audience and is not specifically directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information without verifiable parental consent, we will take steps to delete such information.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold flex items-center gap-2"><Edit3 className="h-6 w-6 text-accent" />8. Changes to This Privacy Notice</h2>
            <p>We may update this privacy notice from time to time. The updated version will be indicated by an updated "Last updated" date and the updated version will be effective as soon as it is accessible. We encourage you to review this privacy notice frequently to be informed of how we are protecting your information.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold flex items-center gap-2"><Mail className="h-6 w-6 text-accent" />9. Contact Us</h2>
            <p>If you have questions or comments about this notice, you may email us at: <a href="mailto:info.cosmofy@protonmail.com" className="text-accent hover:underline">info.cosmofy@protonmail.com</a>.</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
