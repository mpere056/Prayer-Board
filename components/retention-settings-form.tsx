"use client";

import { useState } from "react";

export function RetentionSettingsForm({
  groupSlug,
  initialArchiveDays,
  initialExemptOngoing,
}: {
  groupSlug: string;
  initialArchiveDays: number;
  initialExemptOngoing: boolean;
}) {
  const [archiveDays, setArchiveDays] = useState(initialArchiveDays);
  const [exemptOngoing, setExemptOngoing] = useState(initialExemptOngoing);
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsWorking(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/groups/${encodeURIComponent(groupSlug)}/retention`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultArchiveAfterDays: archiveDays, exemptOngoingFromArchive: exemptOngoing }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "retention_update_failed");
      setMessage("Retention settings saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Retention settings could not be updated.");
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <form className="review-form" onSubmit={save}>
      <label>
        Default time before archive
        <select value={archiveDays} onChange={(event) => setArchiveDays(Number(event.target.value))}>
          <option value={14}>14 days</option>
          <option value={30}>30 days</option>
          <option value={60}>60 days</option>
          <option value={90}>90 days</option>
        </select>
      </label>
      <label className="check-row">
        <input
          checked={exemptOngoing}
          onChange={(event) => setExemptOngoing(event.target.checked)}
          type="checkbox"
        />
        <span>Keep requests marked ongoing out of due-archive maintenance.</span>
      </label>
      <p className="muted">Requests marked “This week” remain due after 7 days. Other active requests use this group default.</p>
      <button className="button" disabled={isWorking} type="submit">Save retention settings</button>
      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error" role="alert">{error}</p> : null}
    </form>
  );
}
