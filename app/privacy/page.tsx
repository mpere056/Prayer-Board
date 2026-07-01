import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="content-page">
      <article className="card content-card">
        <p className="eyebrow">Privacy notice</p>
        <h1>Prayer requests deserve care.</h1>
        <p className="lede">
          Prayer Board is built for small trusted groups. It collects only what is needed to receive, review, and share prayer requests with the group connected to the link you used.
        </p>
        <p className="muted">Effective July 1, 2026.</p>

        <section>
          <h2>What is collected</h2>
          <p>
            A prayer request can include a title, request text, category, duration, and the sharing choice selected on the form. Anonymous guest submissions are not connected to a Prayer Board account.
          </p>
          <p>
            If you sign in with Google, Facebook, or an email account, the app stores the minimum account details needed for sign-in and access control, such as your user ID, email when available, and display name.
          </p>
        </section>

        <section>
          <h2>Who can see a request</h2>
          <p>
            New requests are pending until an administrator reviews them. Approved requests can be seen by signed-in members of that specific group in the app and may be published to that group&apos;s connected Google Doc.
          </p>
          <p>
            Each group is isolated. A request submitted to one group is not shown to another group.
          </p>
        </section>

        <section>
          <h2>Anonymous and named requests</h2>
          <p>
            Anonymous guest requests do not require sign-in. Named requests require Google, Facebook, or a verified email account so the displayed name comes from the signed-in account instead of a free-text field.
          </p>
          <p>
            If you sign in but choose to appear anonymous to the group, members see &quot;Anonymous,&quot; while administrators may still see the account connection for moderation and safety.
          </p>
        </section>

        <section>
          <h2>Google Docs sharing</h2>
          <p>
            A group&apos;s Google Doc is a generated, view-only publication of approved requests. If administrators choose &quot;anyone with the link can view,&quot; anyone who receives that document link can read the published requests.
          </p>
          <p>
            Please do not forward, copy, or screenshot requests outside the intended group without permission.
          </p>
        </section>

        <section>
          <h2>Removing or correcting a request</h2>
          <p>
            Ask a group administrator to remove or correct a request if it contains sensitive details, information shared without permission, or anything that should no longer be visible.
          </p>
          <p>
            To request removal of your account profile, memberships, prayer markers, and requests linked to your account, follow the <Link href="/data-deletion">data-deletion instructions</Link>.
          </p>
        </section>

        <p>
          Read the <Link href="/terms">Terms of Service</Link> or <Link href="/">return to Prayer Board</Link>.
        </p>
      </article>
    </main>
  );
}
