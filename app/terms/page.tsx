import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Prayer Board",
};

export default function TermsPage() {
  return (
    <main className="content-page">
      <article className="card content-card">
        <p className="eyebrow">Terms of Service</p>
        <h1>Use Prayer Board with care.</h1>
        <p className="lede">
          These terms describe the respectful, limited use of Prayer Board. By using the service, you agree to these terms. Effective July 1, 2026.
        </p>

        <section>
          <h2>Purpose of the service</h2>
          <p>
            Prayer Board helps small groups gather, review, and share prayer requests. It is not a public social network, emergency service, counselling service, or substitute for medical, legal, mental-health, or other professional care.
          </p>
        </section>

        <section>
          <h2>Your account</h2>
          <p>
            Anonymous requests do not require an account. Named requests, private group boards, and administration use Firebase Authentication through Google, Facebook, or a verified email account. You are responsible for protecting access to your sign-in account and for using your own identity.
          </p>
          <p>
            Group access is granted and removed by that group&apos;s administrators. Signing in does not automatically make you a member of any group.
          </p>
        </section>

        <section>
          <h2>Prayer requests and permission</h2>
          <p>
            Only submit information that you are allowed to share. Do not disclose another person&apos;s private, identifying, medical, or sensitive information without their permission. You remain responsible for the content you submit.
          </p>
          <p>
            You give Prayer Board and the receiving group permission to store, review, moderate, and display the request only as needed to operate the service. Approved requests may appear on the group&apos;s private app board and its connected view-only Google Doc according to that group&apos;s sharing settings.
          </p>
        </section>

        <section>
          <h2>Respectful and lawful use</h2>
          <p>
            Do not use Prayer Board for harassment, threats, impersonation, spam, unlawful activity, unauthorized access, or content intended to harm or exploit another person. Do not attempt to bypass group boundaries, moderation, authentication, or security controls.
          </p>
          <p>
            Administrators may edit a request for privacy or clarity, reject it, archive it, remove it, or revoke access when needed for safety, privacy, group care, or compliance with these terms.
          </p>
        </section>

        <section>
          <h2>Privacy and sharing</h2>
          <p>
            Prayer requests can be deeply personal. A view-only Google Doc link can still be forwarded, copied, or captured by its readers. Do not redistribute requests outside their intended group without permission. Our <Link href="/privacy">privacy notice</Link> explains what the service stores and who may see it.
          </p>
        </section>

        <section>
          <h2>Availability and changes</h2>
          <p>
            Prayer Board is provided on an as-available basis. We may change, suspend, or discontinue features, and we cannot promise uninterrupted or error-free operation. We may update these terms as the service changes; the effective date on this page will be updated when that happens.
          </p>
        </section>

        <section>
          <h2>Ending use and deleting data</h2>
          <p>
            You may stop using Prayer Board at any time. Contact the administrator of the group whose link you received to request removal or correction of a prayer request. Follow the <Link href="/data-deletion">data-deletion instructions</Link> to request removal of account-linked information or disconnect Facebook access.
          </p>
        </section>

        <section>
          <h2>Questions</h2>
          <p>
            Contact the administrator who gave you your group&apos;s Prayer Board link. That administrator can answer group-specific questions or bring service-level questions to the Prayer Board project owner.
          </p>
        </section>

        <p><Link href="/">Back to Prayer Board</Link></p>
      </article>
    </main>
  );
}
