import Link from "next/link";
import { ArchiveDueRequestsButton } from "@/components/archive-due-requests-button";
import { RequestLifecycleActions } from "@/components/request-lifecycle-actions";
import { requireGroupAdmin } from "@/lib/auth";
import { isApprovedRequestDueForArchive, listPrayerRequestsByStatus } from "@/lib/firebase/firestore";

function submittedLabel(value: { toDate(): Date } | undefined) {
  return value
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(value.toDate())
    : "Unknown date";
}

export default async function ActiveRequestsPage({ params }: { params: Promise<{ groupSlug: string }> }) {
  const { groupSlug } = await params;
  const access = await requireGroupAdmin(groupSlug);
  const requests = await listPrayerRequestsByStatus(access.group.id, "approved");
  const dueRequests = requests.filter((request) => isApprovedRequestDueForArchive(request));

  return (
    <main className="admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">{access.group.name} · administrator</p>
          <h1>Active requests</h1>
        </div>
        <Link className="button button-secondary" href={`/admin/${encodeURIComponent(groupSlug)}`}>Back to administration</Link>
      </div>
      {requests.length === 0 ? (
        <section className="card empty-card">
          <h2>No active requests right now.</h2>
          <p className="muted">Approved requests will appear here after moderation.</p>
        </section>
      ) : (
        <>
          {dueRequests.length > 0 ? (
            <section className="card maintenance-card">
              <div>
                <h2>{dueRequests.length} active request{dueRequests.length === 1 ? " is" : "s are"} due for archive</h2>
                <p className="muted">
                  “This week” requests are due after 7 days. “This month” and unspecified requests are due after 30 days. Ongoing requests are not bulk-archived.
                </p>
              </div>
              <ArchiveDueRequestsButton dueCount={dueRequests.length} groupSlug={groupSlug} />
            </section>
          ) : null}
          <div className="request-list">
            {requests.map((request) => {
              const isDue = isApprovedRequestDueForArchive(request);

              return (
                <article className={isDue ? "card moderation-card due-card" : "card moderation-card"} key={request.id}>
                  <div className="request-meta">
                    <span>{request.anonymity === "named" ? request.submitterName || "Named submission" : "Anonymous"}</span>
                    <span>{submittedLabel(request.submittedAt)}</span>
                    <span>{request.category?.replace("_", " ") || "Other"}</span>
                    {isDue ? <span>Due for archive</span> : null}
                  </div>
                  <h2>{request.title || "Prayer request"}</h2>
                  <p className="request-body">{request.body}</p>
                  <p className="muted">Duration: {request.duration?.replace("_", " ") || "Unspecified"}</p>
                  <RequestLifecycleActions actions={["mark_answered", "archive", "remove"]} groupSlug={groupSlug} requestId={request.id} />
                </article>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
