"use client";

import { useState } from "react";

type Props = {
  groupSlug: string;
  requestId: string;
  status: string;
  initialTitle: string;
  initialBody: string;
  initialCategory: string;
  initialDuration: string;
  hasPendingChange: boolean;
};

const categories = [
  ["health", "Health"], ["family_relationships", "Family and relationships"],
  ["work_school", "Work or school"], ["grief", "Grief"], ["guidance", "Guidance"],
  ["praise", "Praise"], ["other", "Other"],
] as const;

const durations = [
  ["this_week", "This week"], ["this_month", "This month"],
  ["ongoing", "Ongoing"], ["unspecified", "Unspecified"],
] as const;

export function MyRequestActions(props: Props) {
  const [title, setTitle] = useState(props.initialTitle);
  const [body, setBody] = useState(props.initialBody);
  const [category, setCategory] = useState(props.initialCategory);
  const [duration, setDuration] = useState(props.initialDuration);
  const [note, setNote] = useState("");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(action: "update" | "mark_answered" | "remove") {
    if (action === "remove" && !window.confirm("Ask an administrator to remove this prayer request?")) return;
    setWorking(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/my-requests/${encodeURIComponent(props.groupSlug)}/${encodeURIComponent(props.requestId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, title, body, category, duration, note }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "change_request_failed");
      setMessage("Your request was sent to a group administrator for review.");
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your change request could not be sent.");
      setWorking(false);
    }
  }

  if (props.hasPendingChange) {
    return <p className="notice">An administrator is reviewing your requested change.</p>;
  }
  if (["removed", "rejected"].includes(props.status)) return null;

  return (
    <details className="manage-request">
      <summary>Update or manage this request</summary>
      <div className="review-form">
        <label>Title <span className="muted">(optional)</span>
          <input maxLength={120} onChange={(event) => setTitle(event.target.value)} value={title} />
        </label>
        <label>Prayer request
          <textarea maxLength={4000} onChange={(event) => setBody(event.target.value)} rows={6} value={body} />
        </label>
        <div className="form-grid">
          <label>Category
            <select onChange={(event) => setCategory(event.target.value)} value={category}>
              {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>Duration
            <select onChange={(event) => setDuration(event.target.value)} value={duration}>
              {durations.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>
        <label>Note for the administrator <span className="muted">(optional)</span>
          <textarea maxLength={1000} onChange={(event) => setNote(event.target.value)} placeholder="Briefly explain what changed." rows={3} value={note} />
        </label>
        <p className="muted">Changes are reviewed before they affect the group board or Google Doc.</p>
        <div className="moderation-actions">
          <button className="button" disabled={working || !body.trim()} onClick={() => send("update")} type="button">Request update</button>
          {props.status === "approved" ? <button className="button button-secondary" disabled={working} onClick={() => send("mark_answered")} type="button">Mark as answered</button> : null}
          <button className="text-button danger" disabled={working} onClick={() => send("remove")} type="button">Request removal</button>
        </div>
        {message ? <p className="success">{message}</p> : null}
        {error ? <p className="error" role="alert">{error}</p> : null}
      </div>
    </details>
  );
}
