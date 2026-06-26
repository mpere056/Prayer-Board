"use client";

import { useState } from "react";

export function GoogleDocConnect({ groupSlug }: { groupSlug: string }) {
  const [hasAcknowledgedSharing, setHasAcknowledgedSharing] = useState(false);
  const [includeAnswered, setIncludeAnswered] = useState(false);

  function startConnection() {
    const query = new URLSearchParams({
      acknowledgement: "true",
      includeAnswered: String(includeAnswered),
      sharing: "anyone_with_link_viewer",
    });
    window.location.assign(`/api/groups/${encodeURIComponent(groupSlug)}/google-docs/connect?${query}`);
  }

  return (
    <div className="stack">
      <label className="check-row">
        <input
          checked={hasAcknowledgedSharing}
          onChange={(event) => setHasAcknowledgedSharing(event.target.checked)}
          type="checkbox"
        />
        <span>
          I understand that anyone with this Google Doc link can read every approved request and could forward the link.
        </span>
      </label>
      <label className="check-row">
        <input
          checked={includeAnswered}
          onChange={(event) => setIncludeAnswered(event.target.checked)}
          type="checkbox"
        />
        <span>Include an answered-prayers section in this group’s Doc.</span>
      </label>
      <button className="button" disabled={!hasAcknowledgedSharing} onClick={startConnection} type="button">
        Connect Google and create this group’s Doc
      </button>
    </div>
  );
}
