export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">
            ← Back to RideLogger
          </a>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Privacy Policy</h1>
          <p className="mt-1 text-sm text-muted-foreground">Last updated: 16 May 2026</p>
        </div>

        <p className="text-sm text-muted-foreground">
          RideLogger is operated as a tool for volunteer drivers. This policy explains how we manage
          personal information in accordance with the{" "}
          <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles (APPs).
        </p>

        <Section title="1. Kinds of personal information we collect and hold">
          <p>We collect and hold the following personal information:</p>
          <Subsection title="Account information">
            <ul>
              <li>Email address</li>
              <li>Username</li>
              <li>
                Password (stored as a one-way bcrypt hash — we never store or see your plaintext
                password)
              </li>
            </ul>
          </Subsection>
          <Subsection title="Passenger profiles">
            <ul>
              <li>Passenger name</li>
              <li>Passenger address (used for route planning)</li>
            </ul>
          </Subsection>
          <Subsection title="Saved locations">
            <ul>
              <li>Location name</li>
              <li>Address</li>
            </ul>
          </Subsection>
          <p>
            We do not collect sensitive information as defined under the Privacy Act (e.g. health,
            financial, or government identifier information).
          </p>
        </Section>

        <Section title="2. How we collect personal information">
          <p>We collect personal information directly from you when you:</p>
          <ul>
            <li>Create an account</li>
            <li>Create or edit a passenger profile</li>
            <li>Save a named location</li>
          </ul>
          <p>
            We do not collect personal information from third parties or through automated means such
            as tracking pixels or analytics tools.
          </p>
        </Section>

        <Section title="3. Purposes for collecting, holding, using, and disclosing personal information">
          <p>
            We collect and use personal information solely to provide the RideLogger service,
            including:
          </p>
          <ul>
            <li>Authenticating your account and maintaining your session</li>
            <li>Storing and displaying your passenger profiles and saved locations</li>
            <li>Calculating routes and distances for drive planning</li>
          </ul>
          <p>
            We do not use personal information for direct marketing, profiling, or any purpose beyond
            operating the service.
          </p>
        </Section>

        <Section title="4. How we hold personal information and our security practices">
          <p>
            All personal information is stored in a PostgreSQL database provided by{" "}
            <strong>Supabase</strong>, with data hosted in the{" "}
            <strong>ap-southeast-2 (Sydney)</strong> region.
          </p>
          <p>Security measures include:</p>
          <ul>
            <li>
              Passwords are hashed using bcrypt before storage and are never stored or logged in
              plaintext
            </li>
            <li>Database connections are encrypted in transit (TLS)</li>
            <li>
              API secrets and credentials are stored in AWS SSM Parameter Store and are never
              hardcoded or logged
            </li>
            <li>
              Access tokens are short-lived (15 minutes) and stored only in your browser&apos;s{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">sessionStorage</code>,
              which is cleared when the browser tab is closed
            </li>
            <li>
              Session continuity uses a single httpOnly cookie (inaccessible to JavaScript)
              containing a hashed refresh token, valid for 30 days
            </li>
          </ul>
          <p>
            We take reasonable steps to protect personal information from misuse, interference, loss,
            and unauthorised access, modification, or disclosure. When personal information is no
            longer needed, we will take reasonable steps to destroy or de-identify it.
          </p>
        </Section>

        <Section title="5. Cookies">
          <p>We set one cookie:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <Th>Name</Th>
                  <Th>Purpose</Th>
                  <Th>Duration</Th>
                  <Th>Type</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>Refresh token</Td>
                  <Td>Maintains your authenticated session</Td>
                  <Td>30 days</Td>
                  <Td>httpOnly — not accessible to JavaScript</Td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            This cookie stores a securely hashed token, not your password or any personal
            information. It is strictly necessary for the service to function.
          </p>
        </Section>

        <Section title="6. Disclosure of personal information overseas">
          <p>
            We disclose personal information to the following overseas recipients as part of
            operating the service:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <Th>Recipient</Th>
                  <Th>Country</Th>
                  <Th>Purpose</Th>
                  <Th>Privacy policy</Th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <Td>
                    <strong>OpenRouteService</strong>
                  </Td>
                  <Td>Germany</Td>
                  <Td>
                    Calculating routes and distances — addresses from your drive plan are sent to
                    their API
                  </Td>
                  <Td>
                    <ExternalLink href="https://ask.openrouteservice.org/privacy">
                      openrouteservice.org/privacy
                    </ExternalLink>
                  </Td>
                </tr>
                <tr className="border-b border-border/50">
                  <Td>
                    <strong>Vercel</strong>
                  </Td>
                  <Td>United States</Td>
                  <Td>Hosting the web frontend — standard request metadata is processed</Td>
                  <Td>
                    <ExternalLink href="https://vercel.com/legal/privacy-policy">
                      vercel.com/legal/privacy-policy
                    </ExternalLink>
                  </Td>
                </tr>
                <tr className="border-b border-border/50">
                  <Td>
                    <strong>Supabase</strong>
                  </Td>
                  <Td>United States (data stored in Australia, ap-southeast-2)</Td>
                  <Td>Hosting the database — all personal information at rest</Td>
                  <Td>
                    <ExternalLink href="https://supabase.com/privacy">
                      supabase.com/privacy
                    </ExternalLink>
                  </Td>
                </tr>
                <tr>
                  <Td>
                    <strong>AWS</strong>
                  </Td>
                  <Td>Australia (ap-southeast-2) and potentially other regions</Td>
                  <Td>Hosting the API</Td>
                  <Td>
                    <ExternalLink href="https://aws.amazon.com/privacy">
                      aws.amazon.com/privacy
                    </ExternalLink>
                  </Td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Before disclosing personal information to these overseas recipients, we take reasonable
            steps to ensure they handle information in a way consistent with the APPs. By using
            RideLogger, you acknowledge that your personal information may be disclosed overseas.
            Under APP 8.1, we remain accountable for how overseas recipients handle your information
            unless an exception under APP 8.2 applies.
          </p>
        </Section>

        <Section title="7. Access to your personal information">
          <p>
            Under APP 12, you have the right to request access to the personal information we hold
            about you. To make an access request, contact us directly (see section 10). We will
            respond within a reasonable time and may ask you to verify your identity before providing
            access.
          </p>
          <p>
            We will not charge a fee for an access request, though reasonable fees may apply for
            providing access in some circumstances.
          </p>
          <p>
            We may refuse access in limited circumstances permitted by the Privacy Act and will
            explain the reason for any refusal in writing.
          </p>
        </Section>

        <Section title="8. Correction of your personal information">
          <p>
            Under APP 13, if you believe personal information we hold about you is inaccurate, out
            of date, incomplete, irrelevant, or misleading, you may request correction by contacting
            us (see section 10). We will take reasonable steps to correct it within a reasonable
            time.
          </p>
          <p>
            If we decline to correct the information, we will give you our reasons in writing and
            explain how you may complain about our decision.
          </p>
        </Section>

        <Section title="9. Complaints">
          <p>
            If you believe we have breached the APPs or the{" "}
            <em>Privacy Act 1988</em>, please contact us first (see section 10). We will investigate
            and respond within 30 days.
          </p>
          <p>
            If you are not satisfied with our response, you may escalate your complaint to the{" "}
            <strong>Office of the Australian Information Commissioner (OAIC)</strong>:
          </p>
          <ul>
            <li>
              Website:{" "}
              <ExternalLink href="https://www.oaic.gov.au">www.oaic.gov.au</ExternalLink>
            </li>
            <li>Phone: 1300 363 992</li>
            <li>Mail: GPO Box 5218, Sydney NSW 2001</li>
          </ul>
        </Section>

        <Section title="10. Contact">
          <p>
            For privacy enquiries, access or correction requests, or complaints, contact the
            RideLogger administrator directly.
          </p>
        </Section>

        <Section title="11. Changes to this policy">
          <p>
            We may update this policy from time to time. The <strong>Last updated</strong> date at
            the top will reflect any changes. Continued use of RideLogger after a material change
            constitutes acceptance of the updated policy.
          </p>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="space-y-3 text-sm text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_p]:leading-relaxed">
        {children}
      </div>
    </section>
  )
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="font-medium">{title}</p>
      {children}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left py-2 pr-4 font-medium text-muted-foreground whitespace-nowrap">
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="py-2 pr-4 align-top">{children}</td>
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-4 hover:text-foreground"
    >
      {children}
    </a>
  )
}
