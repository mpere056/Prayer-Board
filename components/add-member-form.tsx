"use client";

import type { FormEvent } from "react";
import { useState } from "react";

export function AddMemberForm({ groupSlug }: { groupSlug: string }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsWorking(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/admin/groups/${encodeURIComponent(groupSlug)}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "member_add_failed");
      setEmail("");
      setMessage("Member added.");
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That member could not be added.");
      setIsWorking(false);
    }
  }

  return (
    <form className="card member-form" onSubmit={submit}>
      <h2>Add a member</h2>
      <p className="muted">The person must first sign in with Google or Facebook, or create a verified email account, before Firebase knows their account.</p>
      <label>
        Email
        <input
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="person@example.com"
          required
          type="email"
          value={email}
        />
      </label>
      <label>
        Role
        <select onChange={(event) => setRole(event.target.value as "member" | "admin")} value={role}>
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      <button className="button" disabled={isWorking} type="submit">Add member</button>
      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error" role="alert">{error}</p> : null}
    </form>
  );
}
