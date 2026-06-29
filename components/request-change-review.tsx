"use client";

import { useState } from "react";

export function RequestChangeReview({ groupSlug, requestId }: { groupSlug: string; requestId: string }) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function review(action: "approve" | "decline") {
    if (!window.confirm(`${action === "approve" ? "Approve" : "Decline"} this requested change?`)) return;
    setWorking(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/groups/${encodeURIComponent(groupSlug)}/request-changes/${encodeURIComponent(requestId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "review_failed");
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The change could not be reviewed.");
      setWorking(false);
    }
  }

  return (
    <div>
      <div className="moderation-actions">
        <button className="button" disabled={working} onClick={() => review("approve")} type="button">Approve change</button>
        <button className="text-button" disabled={working} onClick={() => review("decline")} type="button">Decline</button>
      </div>
      {error ? <p className="error" role="alert">{error}</p> : null}
    </div>
  );
}
