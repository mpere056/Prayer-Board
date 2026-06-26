import Link from "next/link";
import { PendingRequestReview } from "@/components/pending-request-review";
import { requireGroupAdmin } from "@/lib/auth";
import { listPendingPrayerRequests } from "@/lib/firebase/firestore";

function submittedLabel(value: { toDate(): Date } | undefined) {
  return value
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(value.toDate())
    : "Just now";
}

export default async function PendingRequestsPage({ params }: { params: Promise<{ groupSlug: string }> }) {
  const { groupSlug } = await params;
  const access = await requireGroupAdmin(groupSlug);
  const requests = await listPendingPrayerRequests(access.group.id);

  return (
    <main className="admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">{access.group.name} · administrator</p>
          <h1>Pending prayer requests</h1>
        </div>
        <Link className="button button-secondary" href={`/admin/${encodeURIComponent(groupSlug)}`}>Back to administration</Link>
      </div>
      {requests.length === 0 ? (
        <section className="card empty-card">
          <h2>Nothing is waiting for review.</h2>
          <p className="muted">New requests will appear here before they are shared with the group.</p>
        </section>
      ) : (
        <div className="request-list">
          {requests.map((request) => (
            <article className="card moderation-card" key={request.id}>
              <div className="request-meta">
                <span>{request.anonymity === "named" ? request.submitterName || "Named submission" : "Anonymous"}</span>
                <span>{submittedLabel(request.submittedAt)}</span>
                <span>{request.category?.replace("_", " ")}</span>
              </div>
              <h2>{request.title || "Prayer request"}</h2>
              <PendingRequestReview
                groupSlug={groupSlug}
                initialBody={request.body}
                initialCategory={request.category || "other"}
                initialDuration={request.duration || "unspecified"}
                initialTitle={request.title || ""}
                requestId={request.id}
              />
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
