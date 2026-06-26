"use client";

import { useState } from "react";

export function ArchiveDueRequestsButton({ dueCount, groupSlug }: { dueCount: number; groupSlug: string }) {
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function archiveDueRequests() {
    if (!window.confirm(`Archive ${dueCount} due active request${dueCount === 1 ? "" : "s"} for this group?`)) return;

    setIsWorking(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/groups/${encodeURIComponent(groupSlug)}/maintenance/archive-due`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("archive_due_failed");
      window.location.reload();
    } catch {
      setError("Due requests could not be archived. Please try again.");
      setIsWorking(false);
    }
  }

  return (
    <div className="stack">
      <button className="button" disabled={isWorking || dueCount === 0} onClick={archiveDueRequests} type="button">
        Archive due requests
      </button>
      {error ? <p className="error" role="alert">{error}</p> : null}
    </div>
  );
}
