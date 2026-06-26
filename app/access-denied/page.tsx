import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <main className="page-center">
      <section className="card route-card">
        <p className="eyebrow">Access needed</p>
        <h1>This space is private.</h1>
        <p className="muted">
          You are signed in, but you do not have access to this group. Ask a group administrator for an invitation if you think this is a mistake.
        </p>
        <Link className="button" href="/">
          Return home
        </Link>
      </section>
    </main>
  );
}
