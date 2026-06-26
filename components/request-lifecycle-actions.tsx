"use client";

import { useState } from "react";

type RequestLifecycleAction = "mark_answered" | "archive" | "restore" | "remove";

const labels: Record<RequestLifecycleAction, string> = {
  mark_answered: "Mark answered",
  archive: "Archive",
  restore: "Restore",
  remove: "Remove",
};

export function RequestLifecycleActions({
  groupSlug,
  requestId,
  actions,
}: {
  groupSlug: string;
  requestId: string;
  actions: RequestLifecycleAction[];
}) {
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateRequest(action: RequestLifecycleAction) {
    if (action === "remove" && !window.confirm("Remove this request permanently from the group?")) return;
    setIsWorking(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/groups/${encodeURIComponent(groupSlug)}/requests/${encodeURIComponent(requestId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      if (!response.ok) throw new Error("request_update_failed");
      window.location.reload();
    } catch {
      setError("That request could not be updated. Please try again.");
      setIsWorking(false);
    }
  }

  return (
    <div className="moderation-actions">
      {actions.map((action) => (
        <button
          className={action === "remove" ? "text-button danger" : action === "mark_answered" ? "button" : "button button-secondary"}
          disabled={isWorking}
          key={action}
          onClick={() => updateRequest(action)}
          type="button"
        >
          {labels[action]}
        </button>
      ))}
      {error ? <p className="error" role="alert">{error}</p> : null}
    </div>
  );
}
