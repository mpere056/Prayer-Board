import Link from "next/link";
import { AddMemberForm } from "@/components/add-member-form";
import { MemberActions } from "@/components/member-actions";
import { requireGroupAdmin } from "@/lib/auth";
import { listGroupMembers } from "@/lib/firebase/firestore";

function joinedLabel(value: { toDate(): Date } | undefined) {
  return value
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(value.toDate())
    : "Unknown";
}

export default async function MembersPage({ params }: { params: Promise<{ groupSlug: string }> }) {
  const { groupSlug } = await params;
  const access = await requireGroupAdmin(groupSlug);
  const members = await listGroupMembers(access.group.id);

  return (
    <main className="admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">{access.group.name} · administrator</p>
          <h1>Members</h1>
        </div>
        <Link className="button button-secondary" href={`/admin/${encodeURIComponent(groupSlug)}`}>Back to administration</Link>
      </div>
      <div className="member-layout">
        <AddMemberForm groupSlug={groupSlug} />
        <section className="card member-list-card">
          <h2>Current access</h2>
          {members.length === 0 ? (
            <p className="muted">No members have been added yet.</p>
          ) : (
            <div className="member-list">
              {members.map((member) => (
                <article className="member-row" key={member.userId}>
                  <div>
                    <h3>{member.displayName || member.email || "Unnamed member"}</h3>
                    <p className="muted">{member.email || "No email recorded"} · {member.role} · joined {joinedLabel(member.createdAt)}</p>
                  </div>
                  {member.userId ? (
                    <MemberActions
                      actions={member.role === "admin" ? ["demote", "remove"] : ["promote", "remove"]}
                      groupSlug={groupSlug}
                      userId={member.userId}
                    />
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
