import Link from "next/link";
import { requireGroupAdmin } from "@/lib/auth";
import {
  getGoogleDocConnection,
  getPrayerRequestStatusCounts,
  listApprovedRequestsDueForArchive,
  listGroupMembers,
  listPendingRequestChanges,
} from "@/lib/firebase/firestore";
import { buildAbsoluteAppUrl } from "@/lib/site-url";

type ReadinessItem = {
  label: string;
  description: string;
  status: "ready" | "attention";
  href?: string;
  actionLabel?: string;
};

function ReadinessRow({ item }: { item: ReadinessItem }) {
  return (
    <li className={`readiness-row readiness-${item.status}`}>
      <div>
        <strong>{item.label}</strong>
        <p className="muted">{item.description}</p>
      </div>
      <div className="readiness-status">
        <span>{item.status === "ready" ? "Ready" : "Needs attention"}</span>
        {item.href ? (
          <Link className="button button-secondary" href={item.href}>
            {item.actionLabel ?? "Open"}
          </Link>
        ) : null}
      </div>
    </li>
  );
}

export default async function GroupReadinessPage({ params }: { params: Promise<{ groupSlug: string }> }) {
  const { groupSlug } = await params;
  const access = await requireGroupAdmin(groupSlug);
  const [counts, googleDoc, members, dueRequests, pendingChanges] = await Promise.all([
    getPrayerRequestStatusCounts(access.group.id),
    getGoogleDocConnection(access.group.id),
    listGroupMembers(access.group.id),
    listApprovedRequestsDueForArchive(access.group.id),
    listPendingRequestChanges(access.group.id),
  ]);
  const adminCount = members.filter((member) => member.role === "admin").length;
  const submissionUrl = buildAbsoluteAppUrl(`/submit/${access.group.submissionToken}`);
  const boardUrl = buildAbsoluteAppUrl(`/board/${encodeURIComponent(groupSlug)}`);

  const items: ReadinessItem[] = [
    {
      label: "Submission link",
      description: submissionUrl
        ? "This group has a production submission link. Send it only to this group."
        : "Set NEXT_PUBLIC_SITE_URL before sharing production links.",
      status: submissionUrl ? "ready" : "attention",
      href: submissionUrl ?? undefined,
      actionLabel: "Open link",
    },
    {
      label: "Private board link",
      description: boardUrl
        ? "Signed-in members can use this private app board for approved requests."
        : "Set NEXT_PUBLIC_SITE_URL before sharing production links.",
      status: boardUrl ? "ready" : "attention",
      href: boardUrl ?? undefined,
      actionLabel: "Open board",
    },
    {
      label: "Google Doc connection",
      description: googleDoc
        ? `Connected with ${googleDoc.sharingMode === "anyone_with_link_viewer" ? "anyone-with-link viewer" : "restricted"} access.`
        : "Connect a Google Doc before using the Doc as the group’s main reading surface.",
      status: googleDoc ? "ready" : "attention",
      href: `/admin/${encodeURIComponent(groupSlug)}/settings`,
      actionLabel: googleDoc ? "Settings" : "Connect",
    },
    {
      label: "Publication health",
      description: googleDoc?.lastPublicationStatus === "failed"
        ? googleDoc.lastPublicationError || "The last Google Doc publication attempt failed."
        : "Publication is not currently reporting a failure.",
      status: googleDoc?.lastPublicationStatus === "failed" ? "attention" : "ready",
      href: `/admin/${encodeURIComponent(groupSlug)}/settings`,
      actionLabel: "Review",
    },
    {
      label: "Administrators",
      description: adminCount >= 2
        ? `${adminCount} administrators are configured.`
        : "Only one administrator is configured. Add a second trusted admin before launch if possible.",
      status: adminCount >= 2 ? "ready" : "attention",
      href: `/admin/${encodeURIComponent(groupSlug)}/members`,
      actionLabel: "Members",
    },
    {
      label: "Members",
      description: members.length > 0
        ? `${members.length} signed-in ${members.length === 1 ? "person has" : "people have"} group access.`
        : "No signed-in members have group access yet.",
      status: members.length > 0 ? "ready" : "attention",
      href: `/admin/${encodeURIComponent(groupSlug)}/members`,
      actionLabel: "Members",
    },
    {
      label: "Pending requests",
      description: counts.pending === 0 && pendingChanges.length === 0
        ? "No submissions or submitter changes are waiting for review."
        : `${counts.pending} new ${counts.pending === 1 ? "request" : "requests"} and ${pendingChanges.length} requested ${pendingChanges.length === 1 ? "change" : "changes"} are waiting for review.`,
      status: counts.pending === 0 && pendingChanges.length === 0 ? "ready" : "attention",
      href: `/admin/${encodeURIComponent(groupSlug)}/requests`,
      actionLabel: "Review",
    },
    {
      label: "Due archive maintenance",
      description: dueRequests.length === 0
        ? "No active requests are due for archive."
        : `${dueRequests.length} active ${dueRequests.length === 1 ? "request is" : "requests are"} due for archive.`,
      status: dueRequests.length === 0 ? "ready" : "attention",
      href: `/admin/${encodeURIComponent(groupSlug)}/active`,
      actionLabel: "Maintain",
    },
    {
      label: "Admin guidance",
      description: "The group-specific admin guide is available with suggested messages and sharing cautions.",
      status: "ready",
      href: `/admin/${encodeURIComponent(groupSlug)}/guide`,
      actionLabel: "Guide",
    },
  ];

  const attentionCount = items.filter((item) => item.status === "attention").length;

  return (
    <main className="content-page">
      <article className="card content-card">
        <p className="eyebrow">{access.group.name} · administrator</p>
        <h1>Launch readiness</h1>
        <p className="lede">
          A practical pre-share checklist for {access.group.name}. It catches setup gaps before you send links to the group.
        </p>

        <section className={attentionCount === 0 ? "readiness-summary ready" : "readiness-summary attention"}>
          <strong>{attentionCount === 0 ? "This group looks ready." : `${attentionCount} item${attentionCount === 1 ? "" : "s"} need attention.`}</strong>
          <p>
            This page checks operational setup. Still use real non-sensitive test requests before inviting the full group.
          </p>
        </section>

        <ol className="readiness-list">
          {items.map((item) => (
            <ReadinessRow item={item} key={item.label} />
          ))}
        </ol>

        <p>
          <Link href={`/admin/${encodeURIComponent(groupSlug)}`}>Back to administration</Link>
        </p>
      </article>
    </main>
  );
}
