import Link from "next/link";

export const metadata = {
  title: "Data deletion | Prayer Board",
};

export default function DataDeletionPage() {
  return (
    <main className="content-page">
      <article className="card content-card">
        <p className="eyebrow">Data deletion</p>
        <h1>You can ask us to remove your data.</h1>
        <p className="lede">
          Prayer Board stores only the account and prayer-request information needed to operate the groups you use. Follow the steps below if you want that information removed.
        </p>

        <section>
          <h2>Request deletion from Prayer Board</h2>
          <ol>
            <li>Contact an administrator of each Prayer Board group you use. This is normally the person who gave you the group&apos;s submission or board link.</li>
            <li>Tell them the email address on your Prayer Board account and that you are requesting account-data deletion.</li>
            <li>The administrator will remove your group access and linked prayer requests, then ask the Prayer Board project owner to remove your Firebase Authentication account and profile.</li>
            <li>Ask the administrator to confirm when the deletion is complete.</li>
          </ol>
          <p>
            If a prayer request included information about another person, identify that request to the administrator so it can be removed promptly. Anonymous guest requests are not connected to an account, so describe the request and approximate submission date instead.
          </p>
        </section>

        <section>
          <h2>Remove Facebook access</h2>
          <p>
            In Facebook, open <strong>Settings and privacy → Settings → Apps and websites</strong>, select Prayer Board, and choose <strong>Remove</strong>. This prevents Prayer Board from using that Facebook connection again.
          </p>
          <p>
            Removing the Facebook connection does not by itself erase prayer requests already submitted to a group. Use the deletion-request steps above when you also want Prayer Board data removed.
          </p>
        </section>

        <section>
          <h2>What will be removed</h2>
          <p>
            The deletion process covers your Prayer Board account profile, group memberships, private prayer markers, linked request-change records, and prayer requests associated with your account. Published copies are removed from the generated Google Doc when the administrator processes the linked requests.
          </p>
        </section>

        <p>
          Read the <Link href="/privacy">privacy notice</Link>, the <Link href="/terms">Terms of Service</Link>, or <Link href="/">return to Prayer Board</Link>.
        </p>
      </article>
    </main>
  );
}
