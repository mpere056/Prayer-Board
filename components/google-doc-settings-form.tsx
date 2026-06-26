"use client";

import { useState } from "react";

export function GoogleDocSettingsForm({
  groupSlug,
  initialIncludeAnswered,
}: {
  groupSlug: string;
  initialIncludeAnswered: boolean;
}) {
  const [includeAnswered, setIncludeAnswered] = useState(initialIncludeAnswered);
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(action: "update_settings" | "retry" | "disconnect") {
    if (action === "disconnect" && !window.confirm("Disconnect publishing for this group? This will not delete or unshare the Google Doc.")) return;
    setIsWorking(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/admin/groups/${encodeURIComponent(groupSlug)}/google-doc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, includeAnswered }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "google_doc_update_failed");
      setMessage(action === "retry" ? "Publication retried." : action === "disconnect" ? "Publishing disconnected." : "Settings saved.");
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Google Doc settings could not be updated.");
      setIsWorking(false);
    }
  }

  return (
    <div className="stack">
      <label className="check-row">
        <input
          checked={includeAnswered}
          onChange={(event) => setIncludeAnswered(event.target.checked)}
          type="checkbox"
        />
        <span>Include an answered-prayers section in this group’s Google Doc.</span>
      </label>
      <div className="admin-links">
        <button className="button" disabled={isWorking} onClick={() => send("update_settings")} type="button">
          Save Doc settings
        </button>
        <button className="button button-secondary" disabled={isWorking} onClick={() => send("retry")} type="button">
          Retry publication
        </button>
        <button className="text-button danger" disabled={isWorking} onClick={() => send("disconnect")} type="button">
          Disconnect publishing
        </button>
      </div>
      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error" role="alert">{error}</p> : null}
    </div>
  );
}
