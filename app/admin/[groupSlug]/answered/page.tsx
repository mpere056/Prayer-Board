import Link from "next/link";
import { RequestLifecycleActions } from "@/components/request-lifecycle-actions";
import { requireGroupAdmin } from "@/lib/auth";
import { listPrayerRequestsByStatus } from "@/lib/firebase/firestore";

function answeredLabel(value: { toDate(): Date } | undefined) {
  return value
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(value.toDate())
    : "Answered";
}

export default async function AnsweredRequestsPage({ params }: { params: Promise<{ groupSlug: string }> }) {
  const { groupSlug } = await params;
  const access = await requireGroupAdmin(groupSlug);
  const requests = await listPrayerRequestsByStatus(access.group.id, "answered");

  return (
    <main className="admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">{access.group.name} · administrator</p>
          <h1>Answered requests</h1>
        </div>
        <Link className="button button-secondary" href={`/admin/${encodeURIComponent(groupSlug)}`}>Back to administration</Link>
      </div>
      {requests.length === 0 ? (
        <section className="card empty-card">
          <h2>No answered requests yet.</h2>
          <p className="muted">Requests marked answered will stay here until they are archived.</p>
        </section>
      ) : (
        <div className="request-list">
          {requests.map((request) => (
            <article className="card moderation-card" key={request.id}>
              <div className="request-meta">
                <span>{request.anonymity === "named" ? request.submitterName || "Named submission" : "Anonymous"}</span>
                <span>{answeredLabel(request.answeredAt)}</span>
                <span>{request.category?.replace("_", " ") || "Other"}</span>
              </div>
              <h2>{request.title || "Prayer request"}</h2>
              <p className="request-body">{request.body}</p>
              <RequestLifecycleActions actions={["archive", "remove"]} groupSlug={groupSlug} requestId={request.id} />
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
