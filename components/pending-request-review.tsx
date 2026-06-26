"use client";

import { useState } from "react";

type PendingRequestReviewProps = {
  groupSlug: string;
  requestId: string;
  initialTitle: string;
  initialBody: string;
  initialCategory: string;
  initialDuration: string;
};

type ReviewAction = "save_edits" | "approve" | "reject" | "remove";

const categoryOptions = [
  ["health", "Health"],
  ["family_relationships", "Family and relationships"],
  ["work_school", "Work or school"],
  ["grief", "Grief"],
  ["guidance", "Guidance"],
  ["praise", "Praise"],
  ["other", "Other"],
] as const;

const durationOptions = [
  ["this_week", "This week"],
  ["this_month", "This month"],
  ["ongoing", "Ongoing"],
  ["unspecified", "Unspecified"],
] as const;

export function PendingRequestReview({
  groupSlug,
  requestId,
  initialTitle,
  initialBody,
  initialCategory,
  initialDuration,
}: PendingRequestReviewProps) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [category, setCategory] = useState(initialCategory);
  const [duration, setDuration] = useState(initialDuration);
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitAction(action: ReviewAction) {
    if (action === "remove" && !window.confirm("Remove this request from the group permanently?")) return;
    if (action === "reject" && !window.confirm("Reject this request so it will not be shared?")) return;

    setIsWorking(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/groups/${encodeURIComponent(groupSlug)}/requests/${encodeURIComponent(requestId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, title, body, category, duration }),
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "request_update_failed");

      if (action === "save_edits") {
        setMessage("Edits saved.");
        setIsWorking(false);
        return;
      }

      window.location.reload();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "That request could not be updated. Please try again.");
      setIsWorking(false);
    }
  }

  return (
    <div className="review-form">
      <label>
        Title <span className="muted">(optional)</span>
        <input maxLength={120} onChange={(event) => setTitle(event.target.value)} value={title} />
      </label>
      <label>
        Request text
        <textarea maxLength={4000} onChange={(event) => setBody(event.target.value)} required rows={7} value={body} />
      </label>
      <div className="form-grid">
        <label>
          Category
          <select onChange={(event) => setCategory(event.target.value)} value={category}>
            {categoryOptions.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          Duration
          <select onChange={(event) => setDuration(event.target.value)} value={duration}>
            {durationOptions.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="muted">
        Edit only what is needed for clarity, permission, or privacy. Saving edits keeps the request pending until you approve it.
      </p>
      <div className="moderation-actions">
        <button className="button button-secondary" disabled={isWorking} onClick={() => submitAction("save_edits")} type="button">
          Save edits
        </button>
        <button className="button" disabled={isWorking || !body.trim()} onClick={() => submitAction("approve")} type="button">
          Approve
        </button>
        <button className="text-button" disabled={isWorking} onClick={() => submitAction("reject")} type="button">
          Reject
        </button>
        <button className="text-button danger" disabled={isWorking} onClick={() => submitAction("remove")} type="button">
          Remove
        </button>
      </div>
      {message ? <p className="success" role="status">{message}</p> : null}
      {error ? <p className="error" role="alert">{error}</p> : null}
    </div>
  );
}
