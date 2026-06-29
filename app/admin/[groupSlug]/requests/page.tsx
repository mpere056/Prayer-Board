import Link from "next/link";
import { PendingRequestReview } from "@/components/pending-request-review";
import { RequestChangeReview } from "@/components/request-change-review";
import { requireGroupAdmin } from "@/lib/auth";
import { listPendingPrayerRequests, listPendingRequestChanges } from "@/lib/firebase/firestore";

function submittedLabel(value: { toDate(): Date } | undefined) {
  return value
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(value.toDate())
    : "Just now";
}

export default async function PendingRequestsPage({ params }: { params: Promise<{ groupSlug: string }> }) {
  const { groupSlug } = await params;
  const access = await requireGroupAdmin(groupSlug);
  const [requests, changes] = await Promise.all([
    listPendingPrayerRequests(access.group.id),
    listPendingRequestChanges(access.group.id),
  ]);

  return (
    <main className="admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">{access.group.name} · administrator</p>
          <h1>Review queue</h1>
        </div>
        <Link className="button button-secondary" href={`/admin/${encodeURIComponent(groupSlug)}`}>Back to administration</Link>
      </div>
      {requests.length === 0 && changes.length === 0 ? (
        <section className="card empty-card">
          <h2>Nothing is waiting for review.</h2>
          <p className="muted">New submissions and changes requested by submitters will appear here.</p>
        </section>
      ) : null}
      {changes.length > 0 ? (
        <section>
          <h2>Changes requested by submitters</h2>
          <div className="request-list">
            {changes.map((change) => (
              <article className="card moderation-card" key={change.id}>
                <div className="request-meta">
                  <span>{change.action === "update" ? "Update requested" : change.action === "mark_answered" ? "Mark answered requested" : "Removal requested"}</span>
                  <span>{submittedLabel(change.requestedAt)}</span>
                  <span>Current status: {change.request.status}</span>
                </div>
                <h3>{change.request.title || "Prayer request"}</h3>
                <p>{change.request.body}</p>
                {change.action === "update" ? (
                  <div className="notice">
                    <strong>Proposed update</strong>
                    <h3>{change.proposedTitle || "Prayer request"}</h3>
                    <p>{change.proposedBody}</p>
                    <p className="muted">{change.proposedCategory?.replaceAll("_", " ")} · {change.proposedDuration?.replaceAll("_", " ")}</p>
                  </div>
                ) : null}
                {change.note ? <p><strong>Submitter note:</strong> {change.note}</p> : null}
                <RequestChangeReview groupSlug={groupSlug} requestId={change.requestId} />
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {requests.length > 0 ? (
        <section>
          <h2>New prayer requests</h2>
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
        </section>
      ) : null}
    </main>
  );
}
