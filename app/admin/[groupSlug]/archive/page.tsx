import Link from "next/link";
import { RequestLifecycleActions } from "@/components/request-lifecycle-actions";
import { requireGroupAdmin } from "@/lib/auth";
import { listPrayerRequestsByStatus } from "@/lib/firebase/firestore";

function archivedLabel(value: { toDate(): Date } | undefined) {
  return value
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(value.toDate())
    : "Archived";
}

export default async function ArchivedRequestsPage({ params }: { params: Promise<{ groupSlug: string }> }) {
  const { groupSlug } = await params;
  const access = await requireGroupAdmin(groupSlug);
  const requests = await listPrayerRequestsByStatus(access.group.id, "archived");

  return (
    <main className="admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">{access.group.name} · administrator</p>
          <h1>Archived requests</h1>
        </div>
        <Link className="button button-secondary" href={`/admin/${encodeURIComponent(groupSlug)}`}>Back to administration</Link>
      </div>
      {requests.length === 0 ? (
        <section className="card empty-card">
          <h2>The archive is empty.</h2>
          <p className="muted">Archived requests are hidden from the active board and Google Doc.</p>
        </section>
      ) : (
        <div className="request-list">
          {requests.map((request) => (
            <article className="card moderation-card" key={request.id}>
              <div className="request-meta">
                <span>{request.anonymity === "named" ? request.submitterName || "Named submission" : "Anonymous"}</span>
                <span>{archivedLabel(request.archivedAt)}</span>
                <span>{request.category?.replace("_", " ") || "Other"}</span>
              </div>
              <h2>{request.title || "Prayer request"}</h2>
              <p className="request-body">{request.body}</p>
              <RequestLifecycleActions actions={["restore", "remove"]} groupSlug={groupSlug} requestId={request.id} />
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
