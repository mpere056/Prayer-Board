import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listGroupsForUser } from "@/lib/firebase/firestore";

export default async function HomePage() {
  const user = await getCurrentUser();
  const groups = user ? await listGroupsForUser(user.id) : [];

  return (
    <main className="hero">
      <section>
        <p className="eyebrow">A gentle shared practice</p>
        <h1>Hold one another in prayer.</h1>
        <p className="lede">
          Prayer Board helps a group gather requests with care, review them respectfully, and share approved requests through one familiar Google Doc.
        </p>
      </section>
      <aside className="card intro-card">
        {user ? (
          <>
            <p className="eyebrow">Signed in</p>
            <h2>Welcome back{user.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}.</h2>
            {groups.length === 0 ? (
              <p className="muted">You are signed in, but you have not been added to a prayer group yet.</p>
            ) : (
              <div className="group-link-list">
                {groups.map((group) => (
                  <div className="group-link-row" key={group.id}>
                    <div>
                      <strong>{group.name}</strong>
                      <p className="muted">{group.role === "admin" ? "Administrator" : "Member"}</p>
                    </div>
                    <div className="admin-links">
                      <Link className="button button-secondary" href={`/board/${encodeURIComponent(group.slug)}`}>
                        Board
                      </Link>
                      {group.role === "admin" ? (
                        <Link className="button" href={`/admin/${encodeURIComponent(group.slug)}`}>
                          Admin
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <p className="eyebrow">For group leaders</p>
            <h2>Private by design. Simple to share.</h2>
            <p>
              Anonymous requests need no account. Named requests, group access, and administration use Google sign-in — never passwords.
            </p>
            <Link className="button" href="/sign-in">
              Continue with Google
            </Link>
          </>
        )}
      </aside>
    </main>
  );
}
