"use client";

import { useState } from "react";

type MemberAction = "promote" | "demote" | "remove";

const labels: Record<MemberAction, string> = {
  promote: "Make admin",
  demote: "Make member",
  remove: "Remove access",
};

export function MemberActions({
  groupSlug,
  userId,
  actions,
}: {
  groupSlug: string;
  userId: string;
  actions: MemberAction[];
}) {
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateMember(action: MemberAction) {
    if (action === "remove" && !window.confirm("Remove this person's access to the group?")) return;
    setIsWorking(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/groups/${encodeURIComponent(groupSlug)}/members/${encodeURIComponent(userId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "member_update_failed");
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That member could not be updated.");
      setIsWorking(false);
    }
  }

  return (
    <div className="moderation-actions">
      {actions.map((action) => (
        <button
          className={action === "remove" ? "text-button danger" : "button button-secondary"}
          disabled={isWorking}
          key={action}
          onClick={() => updateMember(action)}
          type="button"
        >
          {labels[action]}
        </button>
      ))}
      {error ? <p className="error" role="alert">{error}</p> : null}
    </div>
  );
}
